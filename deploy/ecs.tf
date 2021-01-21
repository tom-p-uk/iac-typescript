resource "aws_ecs_cluster" "main" {
  name = "${local.prefix}-cluster"

  tags = local.common_tags
}

# the following 3 resources are for assigning permissions in order to start tasks (see task role vs task execution role)
# 1: create policy that defines what task can do
# 2: create role and define which entities can assume that role (specified in json file)
# 3: attach policy to role

resource "aws_iam_policy" "task_execution_role_policy" {
  name        = "${local.prefix}-task-exec-role-policy"
  path        = "/" # path is used to organise and group iam policies (only available programatically, not via aws console)
  description = "Allow retrieving of images and adding to logs"
  policy      = file("./templates/ecs/task-exec-role.json")
}

resource "aws_iam_role" "task_execution_role" {
  name               = "${local.prefix}-task-exec-role"
  assume_role_policy = file("./templates/ecs/assume-role-policy.json")

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "task_execution_role" {
  role       = aws_iam_role.task_execution_role.name
  policy_arn = aws_iam_policy.task_execution_role_policy.arn
}

# the following role is for giving permissions to the task that it needs to operate at run time (see task role vs task execution role)
# in other words, permissions that the running container will need AFTER it has started

resource "aws_iam_role" "app_iam_role" {
  name               = "${local.prefix}-api-task"
  assume_role_policy = file("./templates/ecs/assume-role-policy.json")

  tags = local.common_tags
}

# cw group for application logs

resource "aws_cloudwatch_log_group" "ecs_task_logs" {
  name = "${local.prefix}-api"

  tags = local.common_tags
}

data "template_file" "api_container_definitions" {
  template = file("./templates/ecs/container-definitions.json.tpl")

  vars = {
    app_image        = var.ecr_image_api
    proxy_image      = var.ecr_image_proxy
    db_host          = aws_db_instance.main.address
    db_name          = aws_db_instance.main.name
    db_user          = aws_db_instance.main.username
    db_pass          = aws_db_instance.main.password
    log_group_name   = aws_cloudwatch_log_group.ecs_task_logs.name
    log_group_region = data.aws_region.current.name
    allowed_hosts    = aws_lb.api.dns_name
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.prefix}-api"
  container_definitions    = data.template_file.api_container_definitions.rendered
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc" # to allow for inter-vpc connections (i.e., to database)
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.task_execution_role.arn
  task_role_arn            = aws_iam_role.app_iam_role.arn
  volume {
    name = "static"
  }

  tags = local.common_tags
}

resource "aws_security_group" "ecs_service" {
  name   = "${local.prefix}-ecs-service"
  vpc_id = aws_vpc.main.id

  egress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol  = "tcp"
    from_port = 5432
    to_port   = 5432
    cidr_blocks = [
      aws_subnet.private_a.cidr_block,
      aws_subnet.private_b.cidr_block
    ]
  }

  ingress { # public inbound access to proxy, which runs on 8000
    protocol        = "tcp"
    from_port       = 8000
    to_port         = 8000
    security_groups = [aws_security_group.lb.id]
  }

  tags = local.common_tags
}

resource "aws_ecs_service" "api" {
  name            = "${local.prefix}-api"
  cluster         = aws_ecs_cluster.main.name
  task_definition = aws_ecs_task_definition.api.family
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [
      aws_subnet.private_a.id,
      aws_subnet.private_b.id
    ]
    security_groups = [aws_security_group.ecs_service.id]
  }

  load_balancer { // tells ECS service to register new tasks with the specified target group
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8000
  }
}

# data "template_file" "ecs_s3_write_policy" {
#   template = file("./templates/ecs/s3-write-policy.json.tpl")

#   vars = {
#     bucket_arn = aws_s3_bucket.app_public_files.arn
#   }
# }

# resource "aws_iam_policy" "ecs_s3_access" {
#   name        = "${local.prefix}-AppS3AccessPolicy"
#   path        = "/"
#   description = "Allow access to the recipe app S3 bucket"
#   policy      = data.template_file.ecs_s3_write_policy.rendered
# }

# resource "aws_iam_role_policy_attachment" "ecs_s3_access" {
#   role       = aws_iam_role.app_iam_role.name
#   policy_arn = aws_iam_policy.ecs_s3_access.arn
# }

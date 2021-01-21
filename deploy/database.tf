resource "aws_db_subnet_group" "main" {
  name = "${local.prefix}-main" # possible glitch with AWS - in order to get name to show up, it needs to be tagged as well
  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id
  ]

  tags = merge(
    local.common_tags,
    map("Name", "${local.prefix}-main")
  )
}

resource "aws_security_group" "rds" {
  name   = "${local.prefix}-rds-inbound-access}"
  vpc_id = aws_vpc.main.id

  ingress {
    protocol  = "tcp"
    from_port = 5432
    to_port   = 5432
    security_groups = [
      aws_security_group.bastion.id,
      aws_security_group.ecs_service.id
    ]
  }

  tags = local.common_tags
}

resource "aws_db_instance" "main" {
  identifier              = "${local.prefix}-db"
  name                    = "recipe"
  allocated_storage       = 20 # storage in gb
  storage_type            = "gp2"
  engine                  = "postgres"
  engine_version          = "11.8"
  instance_class          = "db.t2.micro"
  db_subnet_group_name    = aws_db_subnet_group.main.name
  username                = var.db_username
  password                = var.db_password
  backup_retention_period = 0
  multi_az                = false
  skip_final_snapshot     = true # aws creates a snapshot before db deletion but the name is not unique. destroy works first time, but second time fails as it tries to create a snapshot using an already existing name
  vpc_security_group_ids  = [aws_security_group.rds.id]

  tags = merge(
    local.common_tags,
    map("Name", "${local.prefix}-main")
  )
}

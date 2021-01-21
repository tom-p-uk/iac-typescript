data "aws_ami" "amazon_linux" { # data is something that we retrieve from aws. nothing is created. aws_ami needs to be exact, amazon_linux can be anything
  most_recent = true
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-2.0.*-x86_64-gp2"] # get ami id from ui (create new instance -> choose ami). go to ec2 -> images -> paste id (name = amzn2-ami-hvm-2.0.*-x86_64-gp2). add wildcard for patch version
  }
  owners = ["amazon"]
}

resource "aws_instance" "bastion" {                     # resource blocks are for creating things in aws
  ami                    = data.aws_ami.amazon_linux.id # retrieve ami specified in data block above and use the id for it
  instance_type          = "t2.micro"
  user_data              = file("./templates/bastion/user-data.sh")
  iam_instance_profile   = aws_iam_instance_profile.bastion.name
  key_name               = var.bastion_key_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.bastion.id]

  tags = merge(
    local.common_tags,
    map("Name", "${local.prefix}-bastion")
  )
}

resource "aws_security_group" "bastion" {
  name   = "${local.prefix}-bastion-inbound-outbound-access}"
  vpc_id = aws_vpc.main.id

  ingress {
    protocol    = "tcp"
    from_port   = 22
    to_port     = 22
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

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
      aws_subnet.private_a.cidr_block
    ]
  }

  tags = local.common_tags
}


# 1: create role and define which entities can assume that role (specified in json file)
# 2: attach an aws managed policy to that role
# 3: create an instance profile to allow the passing of this role to an ec2 instance

resource "aws_iam_role" "bastion" {
  name               = "${local.prefix}-bastion"
  assume_role_policy = file("./templates/bastion/instance-profile-policy.json")

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "bastion_attach_policy" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "bastion" {
  name = "${local.prefix}-bastion-instance-profile"
  role = aws_iam_role.bastion.name
}

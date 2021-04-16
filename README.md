# iac-typescript

A small experiment using Terraform's CDKTF library, which allows infrastructure code to be written in a variety of programming languages rather than Hashicorp Config Language (HCL). This repo uses CDKTF TypeScript.

**Src**
The `./src` directory contains code for a simple Node.js API with a Postgres database that I built as a code test a few years ago. The interesting stuff is in the `./terraform` directory.

**Infrastructure**
The infrastructure consists of a VPC with public and private subnets, along with standard network resources (IGW, NAT gateway, etc). The API is a single containerised instance deployed to ECS (Fargate), which sits behind a load balancer, and the database is hosted on RDS. An EC2 bastion instance is also deployed.

**Infrastructure Code**
The `./terraform` directory contains 3 subdirectories:
* The initial infrastructure code is written in HCL and can be found in `./terraform/hcl`.
* A first attempt at migrating to CDKTF can be found in `./terraform/cdktf`. As you can see, all of the configuration is handled in a single file, `./terraform/cdktf/main.ts`, which is a little unruly.
* The final iteration can be found in `./terraform/cdktf-modules`. The resources here are grouped logically, in the way you would see with traditional HCL configuration. These grouped resources are TypeScript classes in the `modules` sub-directory, which are imported and instantiated in `main.ts`. Resources that are required by other resources are passed as dependencies to each other, with the particular resources accessible as public instance variables.

**Pipeline**
A simple pipeline has been setup with Github Actions. See `./.github/workflows`.
When a PR is raised against `main`, the Terraform code is validated (this step is currently commented out, as the infrastructure code used is no longer HCL), and tests are run. The PR can be merged if both run successfully.
When the PR is merged, the validate and test workflow runs again, and if the tests pass, the TypeScript infrastructure code is compiled to JSON using CDKTF commands in `package.json`, and then deployed to AWS using `terraform apply`. Resources are destroyed by running `terraform destroy` locally.

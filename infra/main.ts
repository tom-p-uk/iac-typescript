import {App, TerraformStack, S3Backend, TerraformVariable, TerraformOutput} from 'cdktf'
import {Construct} from 'constructs'
import {DataAwsRegion} from './.gen/providers/aws/data-aws-region';
import {AwsProvider} from './.gen/providers/aws';
import {IamRolePolicyAttachment} from './.gen/providers/aws/iam-role-policy-attachment';
import {SecurityGroup} from './.gen/providers/aws/security-group';
import {IamRole} from './.gen/providers/aws/iam-role';
import {IamInstanceProfile} from './.gen/providers/aws/iam-instance-profile';
import {Instance} from './.gen/providers/aws';
import {DataAwsAmi} from './.gen/providers/aws/data-aws-ami';
import assumeRolePolicy from './policies/assumeRolePolicy';
import {DbInstance} from './.gen/providers/aws/db-instance';
import {DbSubnetGroup} from './.gen/providers/aws/db-subnet-group';
import {LbListener} from './.gen/providers/aws/lb-listener';
import {LbTargetGroup} from './.gen/providers/aws/lb-target-group';
import {Lb} from './.gen/providers/aws/lb';
import {NatGateway} from './.gen/providers/aws/nat-gateway';
import {Eip} from './.gen/providers/aws/eip';
import {RouteTableAssociation} from './.gen/providers/aws/route-table-association';
import {RouteTable} from './.gen/providers/aws/route-table';
import {Subnet} from './.gen/providers/aws/subnet';
import {InternetGateway} from './.gen/providers/aws/internet-gateway';
import {Vpc} from './.gen/providers/aws/vpc';
import {Route} from './.gen/providers/aws';
import {EcsService} from './.gen/providers/aws/ecs-service';
import {EcsTaskDefinition} from './.gen/providers/aws/ecs-task-definition';
import {CloudwatchLogGroup} from './.gen/providers/aws/cloudwatch-log-group';
import {IamPolicy} from './.gen/providers/aws/iam-policy';
import {EcsCluster} from './.gen/providers/aws/ecs-cluster';
import taskExecRolePolicy from './policies/taskExecRole';

interface ITags {
    [key: string]: string 
}

interface IContainerDefinition {
    name: string;
    image: string;
    essential: boolean;
    memoryReservation: number;
    environment: IEnvironment[];
    logConfiguration: ILogConfiguration;
    portMappings: IPortMapping[];
    mountPoints: IMountPoint[];
}

interface IMountPoint {
    readOnly: boolean;
    containerPath: string;
    sourceVolume: string;
}

interface IPortMapping {
    containerPort: number;
    hostPort: number;
}

interface ILogConfiguration {
    logDriver: string;
    options: {
        'awslogs-group': string;
        'awslogs-region': string;
        'awslogs-stream-prefix': string;
    }
}
  
  interface IEnvironment {
    name: string;
    value: string;
}

class ApiStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        new AwsProvider(this, 'aws', {
            region: 'us-east-1'
        });
        const regionNameCurrent = new DataAwsRegion(this, 'current', {});

        const project = 'iac-ts';
        const contact = 'email@someemail.com';
        const workspace = process.env.TF_workspace || 'staging';
        const dbUsername = process.env.TF_VAR_db_username;
        const dbPassword = process.env.TF_VAR_db_password;

        const commonTags: ITags = {
            Environment: workspace,
            Project: project,
            Owner: contact,
            ManagedBy: 'Terraform',
        };
        
        const prefixShort = 'iac';
        const prefix = `${prefixShort}-${workspace}`;
        const bastionKeyName = 'iac-ts-bastion-key-pair';

        const ecrImageApi = new TerraformVariable(this, 'ecr_image_api', {
            type: 'string',
            description: 'ECR Image for API',
            default: '806645795579.dkr.ecr.us-east-1.amazonaws.com/iac-ts-api:latest'
        });

        const vpcMain = new Vpc(this, 'vpc_main', {
            cidrBlock: '10.0.0.0/16',
            enableDnsSupport: true,
            enableDnsHostnames: true,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-vpc`})
        });

        const internetGateway = new InternetGateway(this, 'igw_main', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-main`})
        });

        const subnetPublicA = new Subnet(this, 'subnet_public_a', {
            cidrBlock: '10.0.0.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}a`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const subnetPublicB = new Subnet(this, 'subnet_public_b', {
            cidrBlock: '10.0.1.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}b`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const routeTablePublicA = new RouteTable(this, 'rt_public_a', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const routeTablePublicB = new RouteTable(this, 'rt_public_b', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        new RouteTableAssociation(this, 'rta_public_a', {
            subnetId: subnetPublicA.id,
            routeTableId: routeTablePublicA.id
        });

        new RouteTableAssociation(this, 'rta_public_b', {
            subnetId: subnetPublicB.id,
            routeTableId: routeTablePublicB.id
        });

        new Route(this, 'public_internet_access_a', {
            routeTableId: routeTablePublicA.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
            timeouts: {
                create: '5m'
            }
        });

        new Route(this, 'public_internet_access_b', {
            routeTableId: routeTablePublicB.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
            timeouts: {
                create: '5m'
            }
        });

        const eipPublicA = new Eip(this, 'eip_public_a', {
            vpc: true,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const eipPublicB = new Eip(this, 'eip_public_b', {
            vpc: true,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const natGatewayPublicA = new NatGateway(this, 'nat_public_a', {
            allocationId: eipPublicA.id,
            subnetId: subnetPublicA.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const natGatewayPublicB = new NatGateway(this, 'nat_public_b', {
            allocationId: eipPublicB.id,
            subnetId: subnetPublicB.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const subnetPrivateA = new Subnet(this, 'subnet_private_a', {
            cidrBlock: '10.0.10.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}a`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const subnetPrivateB = new Subnet(this, 'subnet_private_b', {
            cidrBlock: '10.0.11.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}b`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const routeTablePrivateA = new RouteTable(this, 'rt_private_a', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const routeTablePrivateB = new RouteTable(this, 'rt_private_b', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        new RouteTableAssociation(this, 'rta_private_a', {
            subnetId: subnetPrivateA.id,
            routeTableId: routeTablePrivateA.id
        });

        new RouteTableAssociation(this, 'rta_private_b', {
            subnetId: subnetPrivateB.id,
            routeTableId: routeTablePrivateB.id
        });

        new Route(this, 'private_internet_access_a', {
            routeTableId: routeTablePrivateA.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGatewayPublicA.id,
            timeouts: {
                create: '5m'
            }
        });

        new Route(this, 'private_internet_access_b', {
            routeTableId: routeTablePrivateB.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGatewayPublicB.id,
            timeouts: {
                create: '5m'
            }
        });

        const dataAwsAmi = new DataAwsAmi(this, 'amazon_linux', {
            mostRecent: true,
            filter: [
                {
                    name: 'name',
                    values: ['amzn2-ami-hvm-2.0.*-x86_64-gp2']
                },
            ],
            owners: ['amazon'],
        });

        const iamRoleBastion = new IamRole(this, 'bastion_iam_role', {
            name: `${prefix}-bastion`,
            assumeRolePolicy: JSON.stringify(assumeRolePolicy),
            tags: commonTags,
        });

        const iamInstanceProfileBastion = new IamInstanceProfile(this, 'bastion_iam_instance_profile', {
            name: `${prefix}-bastion-instance-profile`,
            role: iamRoleBastion.name
        });

        const securityGroupBastion = new SecurityGroup(this, 'bastion_sg', {
            name: `${prefix}-bastion-inbound-outbound-access`,
            vpcId: vpcMain.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ['0.0.0.0/0'],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                }
            ],
            egress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                },
                {
                    protocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ['0.0.0.0/0'],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                },
                {
                    protocol: 'tcp',
                    fromPort: 5432,
                    toPort: 5432,
                    cidrBlocks: [
                        subnetPrivateA.cidrBlock,
                        subnetPrivateB.cidrBlock
                    ],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                }
            ],
            tags: commonTags
        });

        const instanceBastion = new Instance(this, 'bastion_instance', {
            ami: dataAwsAmi.id,
            instanceType: 't2.micro',
            userData: `
                #!/bin/bash

                sudo yum update -y
                sudo amazon-linux-extras install -y docker
                sudo systemctl enable docker.service
                sudo systemctl start docker.service
                sudo usermod -aG docker ec2-user 
            `,
            iamInstanceProfile: iamInstanceProfileBastion.name,
            keyName: bastionKeyName,
            securityGroups: [securityGroupBastion.id],
            subnetId: subnetPublicA.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-bastion`})
        });

        new IamRolePolicyAttachment(this, 'bastion_attach_policy', {
            role: iamRoleBastion.name,
            policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        });

        const securityGroupLb = new SecurityGroup(this, 'lb', {
            name: `${prefix}-lb`,
            vpcId: vpcMain.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                }
            ],
            egress: [
                {
                    protocol: 'tcp',
                    fromPort: 8000,
                    toPort: 8000,
                    cidrBlocks: ['0.0.0.0/0'],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                }
            ],
            tags: commonTags
        });

        const securityGroupEcsService = new SecurityGroup(this, 'ecs_service', {
            name: `${prefix}-ecs-service`,
            vpcId: vpcMain.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 8000,
                    toPort: 8000,
                    securityGroups: [securityGroupLb.id],
                    cidrBlocks: [],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    description: '',
                    selfAttribute: false
                },
            ],
            egress: [
                {
                    protocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ['0.0.0.0/0'],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                },
                {
                    protocol: 'tcp',
                    fromPort: 5432,
                    toPort: 5432,
                    cidrBlocks: [
                        subnetPrivateA.cidrBlock,
                        subnetPrivateB.cidrBlock
                    ],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    securityGroups: [],
                    description: '',
                    selfAttribute: false
                }
            ],
            tags: commonTags
        });

        const securityGroupRds = new SecurityGroup(this, 'rds', {
            name: `${prefix}-rds-inbound-access`,
            vpcId: vpcMain.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 5432,
                    toPort: 5432,
                    securityGroups: [
                        securityGroupBastion.id,
                        securityGroupEcsService.id
                    ],
                    cidrBlocks: [],
                    ipv6CidrBlocks: [],
                    prefixListIds: [],
                    description: '',
                    selfAttribute: false
                }
            ],
            tags: commonTags
        });

        const dbSubnetGroupMain = new DbSubnetGroup(this, 'db_subnet_group_main', {
            name: `${prefix}-main`,
            subnetIds: [
                subnetPrivateA.id,
                subnetPrivateB.id
            ],
            tags: Object.assign({}, commonTags, {Name: `${prefix}-main`})
        });

        const dbInstanceMain = new DbInstance(this, 'db_instance_main', {
            identifier: `${prefix}-db`,
            name: 'iac',
            allocatedStorage: 20,
            storageType: 'gp2',
            engine: 'postgres',
            engineVersion: '11.8',
            instanceClass: 'db.t2.micro',
            dbSubnetGroupName: dbSubnetGroupMain.name,
            username: dbUsername,
            password: dbPassword,
            backupRetentionPeriod: 0,
            multiAz: false,
            skipFinalSnapshot: true,
            vpcSecurityGroupIds: [securityGroupRds.id],
            tags: Object.assign({}, commonTags, {Name: `${prefix}-main`})
        });


        const ecsClusterMain = new EcsCluster(this, 'ecs_cluster_main', {
            name: `${prefix}-cluster`,
            tags: commonTags
        });

        const iamPolicyTaskExecutionRolePolicy = new IamPolicy(this, 'task_execution_role_policy', {
            name: `${prefix}-task-exec-role-policy`,
            path: '/',
            description: 'Allow retrieving of images and adding to logs',
            policy: JSON.stringify(taskExecRolePolicy)
        });

        const iamRoleTaskExecutionRole = new IamRole(this, 'task_execution_role', {
            name: `${prefix}-task-exec-role`,
            assumeRolePolicy: JSON.stringify(assumeRolePolicy),
            tags: commonTags
        });

        new IamRolePolicyAttachment(this, 'task_execution_role_attachment', {
            role: iamRoleTaskExecutionRole.name,
            policyArn: iamPolicyTaskExecutionRolePolicy.arn
        });

        const iamRoleAppIamRole = new IamRole(this, 'app_iam_role', {
            name: `${prefix}-api-task`,
            assumeRolePolicy: JSON.stringify(assumeRolePolicy),
            tags: commonTags
        });

        const cloudwatchLogGroupEcsTaskLogs = new CloudwatchLogGroup(this, 'ecs_task_logs', {
            name: `${prefix}-api`,
            tags: commonTags
        });

        const apiContainerDefinition: IContainerDefinition = {
            name: 'api',
            image: ecrImageApi.stringValue,
            essential: true,
            memoryReservation: 256,
            environment: [
                {name: 'DB_HOST', value: dbInstanceMain.address},
                {name: 'DB_NAME', value: dbInstanceMain.name},
                {name: 'DB_USER', value: dbInstanceMain.username},
                {name: 'DB_PASS', value: dbInstanceMain.password}
            ],
            logConfiguration: {
                logDriver: 'awslogs',
                options: {
                    'awslogs-group': cloudwatchLogGroupEcsTaskLogs.name,
                    'awslogs-region': regionNameCurrent.name,
                    'awslogs-stream-prefix': 'api'
                }
            },
            portMappings: [
                {
                    containerPort: 8000,
                    hostPort: 8000
                }
            ],
            mountPoints: [
                {
                    readOnly: false,
                    containerPath: '/vol/web',
                    sourceVolume: 'static'
                }
            ]
        };

        const ecsTaskDefinitionApi = new EcsTaskDefinition(this, 'api', {
            family: `${prefix}-api`,
            containerDefinitions: JSON.stringify([
                apiContainerDefinition
            ]),
            requiresCompatibilities: ['FARGATE'],
            networkMode: 'awsvpc',
            cpu: '256',
            memory: '512',
            executionRoleArn: iamRoleTaskExecutionRole.arn,
            taskRoleArn: iamRoleAppIamRole.arn,
            volume: [
                {
                    name: 'static',
                }
            ],
            tags: commonTags
        });

        const lbTargetGroupApi = new LbTargetGroup(this, 'api_lb_target_group', {
            name: `${prefix}-api`,
            protocol: 'HTTP',
            vpcId: vpcMain.id,
            targetType: 'ip',
            port: 8000,
            healthCheck: [
                {
                    path: '/health/'
                }
            ]
        });

        new EcsService(this, 'api_ecs_service', {
            name: `${prefix}-api`,
            cluster: ecsClusterMain.name,
            taskDefinition: ecsTaskDefinitionApi.family,
            desiredCount: 1,
            launchType: 'FARGATE',
            networkConfiguration: [
                {
                    subnets: [
                        subnetPrivateA.id,
                        subnetPrivateB.id
                    ],
                    securityGroups: [securityGroupEcsService.id]
                },
            ],
            loadBalancer: [
                {
                    targetGroupArn: lbTargetGroupApi.arn,
                    containerName: 'api',
                    containerPort: 8000
                }
            ]
        });

        const lbApi = new Lb(this, 'api_lb', {
            name: `${prefix}-main`,
            loadBalancerType: 'application',
            subnets: [
                subnetPublicA.id,
                subnetPublicB.id
            ],
            securityGroups: [securityGroupLb.id],
            tags: commonTags
        });

        new LbListener(this, 'api_lb_listener', {
            loadBalancerArn: lbApi.arn,
            port: 80,
            protocol: 'HTTP',
            defaultAction: [
                {
                    type: 'forward',
                    targetGroupArn: lbTargetGroupApi.arn
                }
            ]
        });

        new TerraformOutput(this, 'db_host', {
            value: dbInstanceMain.address
        });

        new TerraformOutput(this, 'bastion_host', {
            value: instanceBastion.publicDns
        });

        new TerraformOutput(this, 'api_endpoint', {
            value: lbApi.dnsName
        });

    }
}

const app = new App();
const stack = new ApiStack(app, 'typescript-cdktf-aws');

new S3Backend(stack, {
    bucket: 'iac-ts-tfstate',
    key: 'iac-ts.tfstate',
    region: 'us-east-1',
    encrypt: true,
    dynamodbTable: 'iac-ts-tfstate-lock'
});

app.synth();

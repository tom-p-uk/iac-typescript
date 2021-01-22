import {EcsService} from './../.gen/providers/aws/ecs-service';
import {subnetPrivateA, vpcMain, subnetPrivateB} from './network';
import {SecurityGroup} from './../.gen/providers/aws/security-group';
import {EcsTaskDefinition} from './../.gen/providers/aws/ecs-task-definition';
import {CloudwatchLogGroup} from './../.gen/providers/aws/cloudwatch-log-group';
import {IamRolePolicyAttachment} from './../.gen/providers/aws/iam-role-policy-attachment';
import {IamRole} from './../.gen/providers/aws/iam-role';
import {IamPolicy} from './../.gen/providers/aws/iam-policy';
import {EcsCluster} from './../.gen/providers/aws/ecs-cluster';
import {commonTags, prefix} from "./locals";
import apiContainerDefinition from "../containerDefinitions/apiContainerDefinition";
import {securityGroupLb, lbTargetGroupApi} from "./load-balancer";

const ecsClusterMain = new EcsCluster(this, 'main', {
    name: `${prefix}-cluster`,
    tags: commonTags
});

const iamPolicyTaskExecutionRolePolicy = new IamPolicy(this, 'task_execution_role_policy', {
    name: `${prefix}-task-exec-role-policy`,
    path: '/',
    description: 'Allow retrieving of images and adding to logs',
    policy: `
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ecr:GetAuthorizationToken",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "*"
                }
            ]
        }
    `
});

const iamRoleTaskExecutionRole = new IamRole(this, 'task_execution_role', {
    name: `${prefix}-task-exec-role`,
    assumeRolePolicy: `
        {
            "Version": "2012-10-17",
            "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
                },
                "Effect": "Allow"
            }
            ]
        }
    `,
    tags: commonTags
});

const iamRolePolicyAttachmentTaskExecutionRole = new IamRolePolicyAttachment(this, 'task_execution_role', {
    role: iamRoleTaskExecutionRole.name,
    policyArn: iamPolicyTaskExecutionRolePolicy.arn
});

const iamRoleAppIamRole = new IamRole(this, 'app_iam_role', {
    name: `${prefix}-api-task`,
    assumeRolePolicy: `
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Effect": "Allow"
                }
            ]
        }      
    `,
    tags: commonTags
});

export const cloudwatchLogGroupEcsTaskLogs = new CloudwatchLogGroup(this, 'ecs_task_logs', {
    name: `${prefix}-api`,
    tags: commonTags
});

const ecsTaskDefinitionApi = new EcsTaskDefinition(this, 'api', {
    family: `${prefix}-api`,
    containerDefinitions: JSON.stringify(apiContainerDefinition),
    requiresCompatibilities: ['FARGATE'],
    networkMode: 'awsvpc',
    cpu: 256,
    memory: 512,
    executionRoleArn: iamRoleTaskExecutionRole.arn,
    taskRoleArn: iamRoleAppIamRole.arn,
    volume: [
        {
            name: 'static',
        }
    ],
    tags: commonTags
});

export const securityGroupEcsService = new SecurityGroup(this, 'ecs_service', {
    name: `${prefix}-ecs-service`,
    vpcId: vpcMain.id,
    ingress: [
        {
            protocol: 'tcp',
            fromPort: 8000,
            toPort: 8000,
            cidrBlocks: [securityGroupLb.id]
        },
    ],
    egress: [
        {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0']
        },
        {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [
                subnetPrivateA.cidrBlock,
                subnetPrivateB.cidrBlock
            ]
        }
    ],
    tags: commonTags
});

const ecsServiceApi = new EcsService(this, 'api', {
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

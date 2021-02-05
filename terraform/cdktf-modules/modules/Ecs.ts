import {TerraformVariable} from 'cdktf';
import {Construct} from 'constructs';
import {EcsService} from './../.gen/providers/aws/ecs-service';
import {EcsTaskDefinition} from './../.gen/providers/aws/ecs-task-definition';
import {CloudwatchLogGroup} from './../.gen/providers/aws/cloudwatch-log-group';
import {IamRolePolicyAttachment} from './../.gen/providers/aws/iam-role-policy-attachment';
import {IamRole} from './../.gen/providers/aws/iam-role';
import {IamPolicy} from './../.gen/providers/aws/iam-policy';
import {EcsCluster} from './../.gen/providers/aws/ecs-cluster';
import taskExecRolePolicy from '../policies/taskExecRole';
import assumeRolePolicy from '../policies/assumeRolePolicy';
import Network from './Network';
import LoadBalancer from './LoadBalancer';
import Database from './Database';
import ElasticContainerServiceSg from './EcsSg';
import {IOptions} from '../main';

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

class ElasticContainerService {
    public cloudwatchLogGroupEcsTaskLogs: CloudwatchLogGroup;

    constructor(
        scope: Construct,
        options: IOptions,
        ecsSg: ElasticContainerServiceSg,
        network: Network,
        loadBalancer: LoadBalancer,
        database: Database
    ) {
        const {prefix, commonTags, regionNameCurrent} = options;

        const ecrImageApi = new TerraformVariable(scope, 'ecr_image_api', {
            type: 'string',
            description: 'ECR Image for API',
            default: '806645795579.dkr.ecr.us-east-1.amazonaws.com/iac-ts-api:latest'
        });

        const ecsClusterMain = new EcsCluster(scope, 'ecs_cluster_main', {
            name: `${prefix}-cluster`,
            tags: commonTags
        });

        const iamPolicyTaskExecutionRolePolicy = new IamPolicy(scope, 'task_execution_role_policy', {
            name: `${prefix}-task-exec-role-policy`,
            path: '/',
            description: 'Allow retrieving of images and adding to logs',
            policy: JSON.stringify(taskExecRolePolicy)
        });

        const iamRoleTaskExecutionRole = new IamRole(scope, 'task_execution_role', {
            name: `${prefix}-task-exec-role`,
            assumeRolePolicy: JSON.stringify(assumeRolePolicy),
            tags: commonTags
        });

        new IamRolePolicyAttachment(scope, 'task_execution_role_attachment', {
            role: iamRoleTaskExecutionRole.name,
            policyArn: iamPolicyTaskExecutionRolePolicy.arn
        });

        const iamRoleAppIamRole = new IamRole(scope, 'app_iam_role', {
            name: `${prefix}-api-task`,
            assumeRolePolicy: JSON.stringify(assumeRolePolicy),
            tags: commonTags
        });

        const cloudwatchLogGroupEcsTaskLogs = new CloudwatchLogGroup(scope, 'ecs_task_logs', {
            name: `${prefix}-api`,
            tags: commonTags
        });

        const apiContainerDefinition: IContainerDefinition = {
            name: 'api',
            image: ecrImageApi.stringValue,
            essential: true,
            memoryReservation: 256,
            environment: [
                {name: 'DB_HOST', value: database.dbInstance.address},
                {name: 'DB_NAME', value: database.dbInstance.name},
                {name: 'DB_USER', value: database.dbInstance.username},
                {name: 'DB_PASS', value: database.dbInstance.password}
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

        const ecsTaskDefinitionApi = new EcsTaskDefinition(scope, 'api', {
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
        
        new EcsService(scope, 'api_ecs_service', {
            name: `${prefix}-api`,
            cluster: ecsClusterMain.name,
            taskDefinition: ecsTaskDefinitionApi.family,
            desiredCount: 1,
            launchType: 'FARGATE',
            networkConfiguration: [
                {
                    subnets: [
                        network.subnetsPrivate.a.id,
                        network.subnetsPrivate.b.id
                    ],
                    securityGroups: [ecsSg.securityGroup.id]
                },
            ],
            loadBalancer: [
                {
                    targetGroupArn: loadBalancer.lbTargetGroup.arn,
                    containerName: 'api',
                    containerPort: 8000
                }
            ]
        });

        this.cloudwatchLogGroupEcsTaskLogs = cloudwatchLogGroupEcsTaskLogs;
    }
}

export default ElasticContainerService;

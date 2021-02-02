import {LbListener} from './../.gen/providers/aws/lb-listener';
import {LbTargetGroup} from './../.gen/providers/aws/lb-target-group';
import {Lb} from './../.gen/providers/aws/lb';
import {vpcMain, subnetPublicA, subnetPublicB} from './network';
import {SecurityGroup} from './../.gen/providers/aws/security-group';
import {commonTags, prefix} from './locals';

export const securityGroupLb = new SecurityGroup(this, 'lb', {
    name: `${prefix}-lb`,
    vpcId: vpcMain.id,
    ingress: [
        {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
        }
    ],
    egress: [
        {
            protocol: 'tcp',
            fromPort: 8000,
            toPort: 8000,
            cidrBlocks: ['0.0.0.0/0'],
        }
    ],
    tags: commonTags
});

export const lbApi = new Lb(this, 'api', {
    name: `${prefix}-main`,
    loadBalancerType: 'application',
    subnets: [
        subnetPublicA.id,
        subnetPublicB.id
    ],
    securityGroups: [securityGroupLb.id],
    tags: commonTags
});

export const lbTargetGroupApi = new LbTargetGroup(this, 'api', {
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

new LbListener(this, 'api', {
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

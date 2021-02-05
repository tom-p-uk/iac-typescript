import {Construct} from 'constructs';
import {LbListener} from './../.gen/providers/aws/lb-listener';
import {LbTargetGroup} from './../.gen/providers/aws/lb-target-group';
import {Lb} from './../.gen/providers/aws/lb';
import {SecurityGroup} from './../.gen/providers/aws/security-group';
import Network from './Network';
import {IOptions} from '../main';

class LoadBalancer {
    public lb: Lb;
    public lbTargetGroup: LbTargetGroup;
    public securityGroup: SecurityGroup;

    constructor(scope: Construct, options: IOptions, network: Network) {
        const {prefix, commonTags} = options;

        const securityGroupLb = new SecurityGroup(scope, 'lb', {
            name: `${prefix}-lb`,
            vpcId: network.vpc.id,
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
        
        const lbApi = new Lb(scope, 'api_lb', {
            name: `${prefix}-main`,
            loadBalancerType: 'application',
            subnets: [
                network.subnetsPublic.a.id,
                network.subnetsPublic.b.id
            ],
            securityGroups: [securityGroupLb.id],
            tags: commonTags
        });
        
        const lbTargetGroupApi = new LbTargetGroup(scope, 'api_lb_target_group', {
            name: `${prefix}-api`,
            protocol: 'HTTP',
            vpcId: network.vpc.id,
            targetType: 'ip',
            port: 8000,
            healthCheck: [
                {
                    path: '/health/'
                }
            ]
        });
        
        new LbListener(scope, 'api_lb_listener', {
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

        this.lb = lbApi;
        this.lbTargetGroup = lbTargetGroupApi;
        this.securityGroup = securityGroupLb;
    }
}

export default LoadBalancer;

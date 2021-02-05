import {Construct} from 'constructs';
import {SecurityGroup} from '../.gen/providers/aws/security-group';
import {IOptions} from '../main';
import LoadBalancer from './load-balancer';
import Network from './network';

class ElasticContainerServiceSg {
    public securityGroup: SecurityGroup;

    constructor(scope: Construct, options: IOptions, network: Network, loadBalancer: LoadBalancer) {
        const {prefix, commonTags} = options;

        this.securityGroup = new SecurityGroup(scope, 'ecs_service', {
            name: `${prefix}-ecs-service`,
            vpcId: network.vpc.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 8000,
                    toPort: 8000,
                    securityGroups: [loadBalancer.securityGroup.id],
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
                        network.subnetsPrivate.a.cidrBlock,
                        network.subnetsPrivate.b.cidrBlock
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
    }
}

export default ElasticContainerServiceSg;

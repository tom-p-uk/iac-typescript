import {Construct} from 'constructs';
import {IamRolePolicyAttachment} from './../.gen/providers/aws/iam-role-policy-attachment';
import {SecurityGroup} from './../.gen/providers/aws/security-group';
import {IamRole} from './../.gen/providers/aws/iam-role';
import {IamInstanceProfile} from './../.gen/providers/aws/iam-instance-profile';
import {Instance} from '../.gen/providers/aws';
import {DataAwsAmi} from '.././.gen/providers/aws/data-aws-ami';
import assumeRolePolicy from '../policies/assumeRolePolicy';
import {IOptions} from '../main';
import Network from './network';

class Bastion {
    public instanceBastion: Instance;
    public securityGroup: SecurityGroup;

    constructor(scope: Construct, options: IOptions, network: Network) {
        const {prefix, commonTags} = options;

        const dataAwsAmi = new DataAwsAmi(scope, 'amazon_linux', {
            mostRecent: true,
            filter: [
                {
                    name: 'name',
                    values: ['amzn2-ami-hvm-2.0.*-x86_64-gp2']
                },
            ],
            owners: ['amazon'],
        });

        const bastionKeyName = 'iac-ts-bastion-key-pair';

        const iamRoleBastion = new IamRole(scope, 'bastion_iam_role', {
            name: `${prefix}-bastion`,
            assumeRolePolicy: JSON.stringify(assumeRolePolicy),
            tags: commonTags,
        });

        const iamInstanceProfileBastion = new IamInstanceProfile(scope, 'bastion_iam_instance_profile', {
            name: `${prefix}-bastion-instance-profile`,
            role: iamRoleBastion.name
        });

        const securityGroupBastion = new SecurityGroup(scope, 'bastion_sg', {
            name: `${prefix}-bastion-inbound-outbound-access`,
            vpcId: network.vpc.id,
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

        const instanceBastion = new Instance(scope, 'bastion_instance', {
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
            subnetId: network.subnetsPublic.a.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-bastion`})
        });

        new IamRolePolicyAttachment(scope, 'bastion_attach_policy', {
            role: iamRoleBastion.name,
            policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        });

        this.instanceBastion = instanceBastion;
        this.securityGroup = securityGroupBastion;
    }
}      

export default Bastion;

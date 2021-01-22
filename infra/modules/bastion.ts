import {IamRolePolicyAttachment} from './../.gen/providers/aws/iam-role-policy-attachment';
import {SecurityGroup} from './../.gen/providers/aws/security-group';
import {commonTags, prefix} from './locals';
import {IamRole} from './../.gen/providers/aws/iam-role';
import {IamInstanceProfile} from './../.gen/providers/aws/iam-instance-profile';
import {Instance} from '../.gen/providers/aws';
import {DataAwsAmi} from '.././.gen/providers/aws/data-aws-ami';
import {bastionKeyName} from "./variables";
import { subnetPrivateA, subnetPrivateB, subnetPublicA, vpcMain } from "./network";


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

const iamRoleBastion = new IamRole(this, 'bastion', {
    name: `${prefix}-bastion`,
    assumeRolePolicy: `
        {
            "Version": "2012-10-17",
            "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Principal": {
                "Service": "ec2.amazonaws.com"
                },
                "Effect": "Allow"
            }
            ]
        }
        
    `,
    tags: commonTags,
});

const iamInstanceProfileBastion = new IamInstanceProfile(this, 'bastion', {
    name: `${prefix}-bastion-instance-profile`,
    role: iamRoleBastion.name
});

export const securityGroupBastion = new SecurityGroup(this, 'bastion', {
    name: `${prefix}-bastion-inbound-outbound-access`,
    vpcId: vpcMain.id,
    ingress: [
        {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['0.0.0.0/0']
        }
    ],
    egress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
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

export const instanceBastion = new Instance(this, 'bastion', {
    ami: dataAwsAmi.id,
    instanceType: 't2.micro',
    userData: `
        #!/bin/bash

        sudo yum update -y
        sudo amazon-linux-extras install -y docker
        sudo systemctl enable docker.service
        sudo systemctl start docker.service
        sudo usermod -aG docker ec2-user # add ec2-user to docker group so non-root user can manage docker    
    `,
    iamInstanceProfile: iamInstanceProfileBastion,
    keyName: bastionKeyName,
    securityGroups: securityGroupBastion.id,
    subnetId: subnetPublicA.id,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-bsation`})
});

const iamRolePolicyAttachmentBastion = new IamRolePolicyAttachment(this, 'bastion_attach_policy', {
    role: iamRoleBastion.name,
    policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
});

const iamInstanceProfile = new IamInstanceProfile(this, 'bastion', {
    name: `${prefix}-bastion-instance-profile`,
    role: iamRoleBastion.name
});
  
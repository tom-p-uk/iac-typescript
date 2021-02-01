import {securityGroupEcsService} from './ecs';
import {dbPassword, dbUsername} from './variables';
import {DbInstance} from './../.gen/providers/aws/db-instance';
import {DbSubnetGroup} from './../.gen/providers/aws/db-subnet-group';
import {securityGroupBastion} from './bastion';
import {vpcMain, subnetPrivateA, subnetPrivateB} from './network';
import {SecurityGroup} from './../.gen/providers/aws/security-group';
import {commonTags, prefix} from './locals';

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
            ]
        }
    ],
    tags: commonTags
});

const dbSubnetGroupMain = new DbSubnetGroup(this, 'main', {
    name: `${prefix}-main`,
    subnetIds: [
        subnetPrivateA.id,
        subnetPrivateB.id
    ],
    tags: Object.assign({}, commonTags, {Name: `${prefix}-main`})
});

export const dbInstanceMain = new DbInstance(this, 'main', {
    identifier: `${prefix}-db`,
    name: 'recipe',
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

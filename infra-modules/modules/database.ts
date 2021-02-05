import {Construct} from 'constructs';
import {DbInstance} from './../.gen/providers/aws/db-instance';
import {DbSubnetGroup} from './../.gen/providers/aws/db-subnet-group';
import {SecurityGroup} from './../.gen/providers/aws/security-group';
import Network from './network';
import Bastion from './bastion';
import ElasticContainerServiceSg from './ecsSg';
import {IOptions} from '../main';

class Database {
    public dbInstance: DbInstance;

    constructor(
        scope: Construct,
        options: IOptions,
        network: Network,
        bastion: Bastion,
        ecsSecurityGroup: ElasticContainerServiceSg
    ) {
        const {prefix, commonTags} = options;

        const dbUsername = process.env.TF_VAR_db_username;
        const dbPassword = process.env.TF_VAR_db_password;

        const securityGroupRds = new SecurityGroup(scope, 'rds', {
            name: `${prefix}-rds-inbound-access`,
            vpcId: network.vpc.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 5432,
                    toPort: 5432,
                    securityGroups: [
                        bastion.securityGroup.id,
                        ecsSecurityGroup.securityGroup.id
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

        const dbSubnetGroupMain = new DbSubnetGroup(scope, 'db_subnet_group_main', {
            name: `${prefix}-main`,
            subnetIds: [
                network.subnetsPrivate.a.id,
                network.subnetsPrivate.b.id
            ],
            tags: Object.assign({}, commonTags, {Name: `${prefix}-main`})
        });

        const dbInstanceMain = new DbInstance(scope, 'db_instance_main', {
            identifier: `${prefix}-db`,
            name: 'postgres',
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

        this.dbInstance = dbInstanceMain;
    }
}

export default Database;

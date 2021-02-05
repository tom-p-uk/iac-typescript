import {TerraformOutput} from 'cdktf';
import {Construct} from 'constructs';
import Database from './database';
import Bastion from './bastion';
import LoadBalancer from './load-balancer';

class Outputs {
    constructor(scope: Construct, database: Database, bastion: Bastion, loadBalancer: LoadBalancer) {
        new TerraformOutput(scope, 'db_host', {
            value: database.dbInstance.address
        });

        new TerraformOutput(scope, 'bastion_host', {
            value: bastion.instanceBastion.publicDns
        });

        new TerraformOutput(scope, 'api_endpoint', {
            value: loadBalancer.lb.dnsName
        });
    }
}

export default Outputs;

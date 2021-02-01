import {lbApi} from './load-balancer';
import {instanceBastion} from './bastion';
import {TerraformOutput} from 'cdktf';
import {dbInstanceMain} from './database';

new TerraformOutput(this, 'db_host', {
    value: dbInstanceMain.address
});

new TerraformOutput(this, 'bastion_host', {
    value: instanceBastion.publicDns
});

new TerraformOutput(this, 'api_endpoint', {
    value: lbApi.dnsName
});

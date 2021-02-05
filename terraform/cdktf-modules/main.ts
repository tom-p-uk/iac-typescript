import {App, TerraformStack, S3Backend} from 'cdktf'
import {Construct} from 'constructs'
import {DataAwsRegion} from './.gen/providers/aws/data-aws-region';
import {AwsProvider} from './.gen/providers/aws';
import Network from './modules/Network';
import Bastion from './modules/Bastion';
import Database from './modules/Database';
import ElasticContainerService from './modules/Ecs';
import LoadBalancer from './modules/LoadBalancer';
import ElasticContainerServiceSg from './modules/EcsSg';
import Outputs from './modules/Outputs';

export interface ITags {
    [key: string]: string 
}

export interface IOptions {
    prefix: string;
    commonTags: ITags;
    regionNameCurrent: DataAwsRegion;
}

class ApiStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        new AwsProvider(this, 'aws', {
            region: 'us-east-1'
        });
        const regionNameCurrent = new DataAwsRegion(this, 'current', {});
        const workspace = process.env.TF_workspace || 'staging';

        const commonTags: ITags = {
            Environment: workspace,
            Project: 'iac-ts',
            Owner: 'email@someemail.com',
            ManagedBy: 'Terraform'
        };
        
        const prefixShort = 'iac';
        const prefix = `${prefixShort}-${workspace}`;
        const options: IOptions = {
            prefix,
            commonTags,
            regionNameCurrent
        };

        const network = new Network(this, options);
        const bastion = new Bastion(this, options, network);
        const loadBalancer =  new LoadBalancer(this, options, network);
        const ecsSg = new ElasticContainerServiceSg(this, options, network, loadBalancer);
        const database = new Database(this, options, network, bastion, ecsSg);
        new ElasticContainerService(this, options, ecsSg, network, loadBalancer, database);
        new Outputs(this, database, bastion, loadBalancer);
    }
}

const app = new App();
const stack = new ApiStack(app, 'typescript-cdktf-aws');

new S3Backend(stack, {
    bucket: 'iac-ts-tfstate',
    key: 'iac-ts.tfstate',
    region: 'us-east-1',
    encrypt: true,
    dynamodbTable: 'iac-ts-tfstate-lock'
});

app.synth();

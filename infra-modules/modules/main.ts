import {App, TerraformStack, S3Backend} from 'cdktf'
import {Construct} from 'constructs'
import {DataAwsRegion} from './../.gen/providers/aws/data-aws-region';
import {AwsProvider} from '../.gen/providers/aws'

export const regionNameCurrent = new DataAwsRegion(this, 'current', {});

class ApiStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        new AwsProvider(this, 'aws', {
            region: 'us-east-1'
        });
    }
}

const app = new App();
const stack = new ApiStack(app, 'typescript-aws');

new S3Backend(stack, {
    bucket: 'terraform-course-tfstate',
    key: 'recipe-app.tfstate',
    region: 'us-east-1',
    encrypt: true,
    dynamodbTable: 'recipe-app-api-devops-tfstate-lock'
});

app.synth();

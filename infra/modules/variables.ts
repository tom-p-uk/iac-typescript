import {TerraformVariable} from "cdktf"

export const prefixShort = new TerraformVariable(this, 'prefix', {
    default: 'raad'
});

export const project = new TerraformVariable(this, 'project', {
    default: 'recipe-app-api-devops'
});

export const contact = new TerraformVariable(this, 'contact', {
    default: 'email@someemail.com'
});

export const bastionKeyName = new TerraformVariable(this, 'bastion_key_name', {
    default: "recipe-app-api-devops-bastion"
});

export const dbUsername = new TerraformVariable(this, 'db_username', {});

export const dbPassword = new TerraformVariable(this, 'db_password', {
    default: "recipe-app-api-devops-bastion"
});

export const ecrImageApi = new TerraformVariable(this, 'ecr_image_api', {
    type: 'string',
    description: 'ECR Image for API',
    default: "806645795579.dkr.ecr.us-east-1.amazonaws.com/recipe-app-api-devops:latest"
});

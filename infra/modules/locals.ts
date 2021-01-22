import {TerraformLocal} from 'cdktf'

import {project, contact, prefixShort} from './variables';

export const commonTags = new TerraformLocal(this, 'common_tags', {
    Environment: terraform.workspace,
    Project: project,
    Owner: contact,
    ManagedBy: "Terraform",
});

export const prefix = new TerraformLocal(this, 'prefix', `${prefixShort}-${terraform.workspace}"`);

import {TerraformLocal} from 'cdktf'

import {project, contact, prefixShort} from './variables';

export const workspace = process.env.TF_workspace || 'staging';

export const commonTags = new TerraformLocal(this, 'common_tags', {
    Environment: workspace,
    Project: project,
    Owner: contact,
    ManagedBy: "Terraform",
});

export const prefix = new TerraformLocal(this, 'prefix', `${prefixShort}-${workspace}`);

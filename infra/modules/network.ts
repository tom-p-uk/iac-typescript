import {commonTags, prefix} from './locals';
import {NatGateway} from './../.gen/providers/aws/nat-gateway';
import {Eip} from './../.gen/providers/aws/eip';
import {RouteTableAssociation} from './../.gen/providers/aws/route-table-association';
import {RouteTable} from './../.gen/providers/aws/route-table';
import {regionNameCurrent} from './main';
import {Subnet} from './../.gen/providers/aws/subnet';
import {InternetGateway} from './../.gen/providers/aws/internet-gateway';
import {Vpc} from './../.gen/providers/aws/vpc';
import { Route } from "../.gen/providers/aws";

export const vpcMain = new Vpc(this, 'main', {
    cidrBlock: "10.0.0.0/16",
    enableDnsSupport: true,
    enableDnsHostnames: true

    // tags = merge(
    //     local.common_tags,
    //     map("Name", "${local.prefix}-vpc")
    //   )
});

const internetGatewayMain = new InternetGateway(this, 'main', {
    vpcId: vpcMain.id,

    // tags = merge(
    //     local.common_tags,
    //     map("Name", "${local.prefix}-main")
    //   )
});

/*############################################################
###################### Public subnets #######################
############################################################*/

export const subnetPublicA = new Subnet(this, 'public_a', {
    cidrBlock: "10.0.0.0/24",
    mapPublicIpOnLaunch: true,
    vpcId: vpcMain.id,
    availabilityZone: `${regionNameCurrent.name}a`,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
});

export const subnetPublicB = new Subnet(this, 'public_b', {
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
    vpcId: vpcMain.id,
    availabilityZone: `${regionNameCurrent.name}b`,
    Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
});

const routeTablePublicA = new RouteTable(this, 'public_a', {
    vpcId: vpcMain.id,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
});

const routeTablePublicB = new RouteTable(this, 'public_b', {
    vpcId: vpcMain.id,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
});

const routeTableAssociationPublicA = new RouteTableAssociation(this, 'public_a', {
    subnetId: subnetPublicA.id,
    routeTableId: routeTablePublicA.id
});

const routeTableAssociationPublicB = new RouteTableAssociation(this, 'public_b', {
    subnetId: subnetPublicB.id,
    routeTableId: routeTablePublicB.id
});

const awsRoutePublicInternetAccessA = new Route(this, 'public_internet_access_a', {
    routeTableId: routeTablePublicA.id,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: internetGatewayMain.id,
    timeouts: {
        create: '5m'
    }
});

const awsRoutePublicInternetAccessB = new Route(this, 'public_internet_access_b', {
    routeTableId: routeTablePublicB.id,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: internetGatewayMain.id,
    timeouts: {
        create: '5m'
    }
});

const eipPublicA = new Eip(this, 'public_a', {
    vpc: true,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
});

const eipPublicB = new Eip(this, 'public_b', {
    vpc: true,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
});

const natGatewayPublicA = new NatGateway(this, 'public_a', {
    allocationId: eipPublicA.id,
    subnetId: subnetPublicA.id,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
});

const natGatewayPublicB = new NatGateway(this, 'public_b', {
    allocationId: eipPublicB.id,
    subnetId: subnetPublicB.id,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
});


/*############################################################
###################### Public subnets #######################
############################################################*/

export const subnetPrivateA = new Subnet(this, 'private_a', {
    cidrBlock: "10.0.10.0/24",
    mapPublicIpOnLaunch: true,
    vpcId: vpcMain.id,
    availabilityZone: `${regionNameCurrent.name}a`,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
});

export const subnetPrivateB = new Subnet(this, 'private_b', {
    cidrBlock: "10.0.11.0/24",
    mapPublicIpOnLaunch: true,
    vpcId: vpcMain.id,
    availabilityZone: `${regionNameCurrent.name}b`,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
});

const routeTablePrivateA = new RouteTable(this, 'private_a', {
    vpcId: vpcMain.id,,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
});

const routeTablePrivateB = new RouteTable(this, 'private_b', {
    vpcId: vpcMain.id,
    tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
});

const routeTableAssociationPrivateA = new RouteTableAssociation(this, 'private_a', {
    subnetId: subnetPrivateA.id,
    routeTableId: routeTablePrivateA.id
});

const routeTableAssociationPrivateB = new RouteTableAssociation(this, 'private_b', {
    subnetId: subnetPrivateB.id,
    routeTableId: routeTablePrivateB.id
});

const awsRoutePrivateInternetAccessA = new Route(this, 'private_nternet_access_a', {
    routeTableId: routeTablePrivateA.id,
    destinationCidrBlock: '0.0.0.0/0',
    natGatewayId: natGatewayPublicA.id,
    timeouts: {
        create: '5m'
    }
});

const awsRoutePrivateInternetAccessB = new Route(this, 'private_nternet_access_b', {
    routeTableId: routeTablePrivateB.id,
    destinationCidrBlock: '0.0.0.0/0',
    natGatewayId: natGatewayPublicB.id,
    timeouts: {
        create: '5m'
    }
});

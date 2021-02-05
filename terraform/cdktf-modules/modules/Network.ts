import {Construct} from 'constructs';
import {NatGateway} from './../.gen/providers/aws/nat-gateway';
import {Eip} from './../.gen/providers/aws/eip';
import {RouteTableAssociation} from './../.gen/providers/aws/route-table-association';
import {RouteTable} from './../.gen/providers/aws/route-table';
import {Subnet} from './../.gen/providers/aws/subnet';
import {InternetGateway} from './../.gen/providers/aws/internet-gateway';
import {Vpc} from './../.gen/providers/aws/vpc';
import {Route} from '../.gen/providers/aws';
import {IOptions} from '../main';

export interface ISubnets {
    a: Subnet;
    b: Subnet;
}

class Network {
    public vpc: Vpc;
    public subnetsPublic: ISubnets; 
    public subnetsPrivate: ISubnets;

    constructor(scope: Construct, options: IOptions) {
        const {prefix, commonTags, regionNameCurrent} = options;

        const vpcMain = new Vpc(scope, 'vpc_main', {
            cidrBlock: '10.0.0.0/16',
            enableDnsSupport: true,
            enableDnsHostnames: true,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-vpc`})
        });

        const internetGateway = new InternetGateway(scope, 'igw_main', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-main`})
        });

        const subnetPublicA = new Subnet(scope, 'subnet_public_a', {
            cidrBlock: '10.0.0.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}a`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const subnetPublicB = new Subnet(scope, 'subnet_public_b', {
            cidrBlock: '10.0.1.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}b`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const routeTablePublicA = new RouteTable(scope, 'rt_public_a', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const routeTablePublicB = new RouteTable(scope, 'rt_public_b', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        new RouteTableAssociation(scope, 'rta_public_a', {
            subnetId: subnetPublicA.id,
            routeTableId: routeTablePublicA.id
        });

        new RouteTableAssociation(scope, 'rta_public_b', {
            subnetId: subnetPublicB.id,
            routeTableId: routeTablePublicB.id
        });

        new Route(scope, 'public_internet_access_a', {
            routeTableId: routeTablePublicA.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
            timeouts: {
                create: '5m'
            }
        });

        new Route(scope, 'public_internet_access_b', {
            routeTableId: routeTablePublicB.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
            timeouts: {
                create: '5m'
            }
        });

        const eipPublicA = new Eip(scope, 'eip_public_a', {
            vpc: true,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const eipPublicB = new Eip(scope, 'eip_public_b', {
            vpc: true,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const natGatewayPublicA = new NatGateway(scope, 'nat_public_a', {
            allocationId: eipPublicA.id,
            subnetId: subnetPublicA.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const natGatewayPublicB = new NatGateway(scope, 'nat_public_b', {
            allocationId: eipPublicB.id,
            subnetId: subnetPublicB.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const subnetPrivateA = new Subnet(scope, 'subnet_private_a', {
            cidrBlock: '10.0.10.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}a`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const subnetPrivateB = new Subnet(scope, 'subnet_private_b', {
            cidrBlock: '10.0.11.0/24',
            mapPublicIpOnLaunch: true,
            vpcId: vpcMain.id,
            availabilityZone: `${regionNameCurrent.name}b`,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-b`})
        });

        const routeTablePrivateA = new RouteTable(scope, 'rt_private_a', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        const routeTablePrivateB = new RouteTable(scope, 'rt_private_b', {
            vpcId: vpcMain.id,
            tags: Object.assign({}, commonTags, {Name: `${prefix}-public-a`})
        });

        new RouteTableAssociation(scope, 'rta_private_a', {
            subnetId: subnetPrivateA.id,
            routeTableId: routeTablePrivateA.id
        });

        new RouteTableAssociation(scope, 'rta_private_b', {
            subnetId: subnetPrivateB.id,
            routeTableId: routeTablePrivateB.id
        });

        new Route(scope, 'private_internet_access_a', {
            routeTableId: routeTablePrivateA.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGatewayPublicA.id,
            timeouts: {
                create: '5m'
            }
        });

        new Route(scope, 'private_internet_access_b', {
            routeTableId: routeTablePrivateB.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGatewayPublicB.id,
            timeouts: {
                create: '5m'
            }
        });

        this.vpc = vpcMain;
        this.subnetsPublic = {
            a: subnetPublicA,
            b: subnetPublicB
        };
        this.subnetsPrivate = {
            a: subnetPrivateA,
            b: subnetPrivateB
        };

    }
}

export default Network;

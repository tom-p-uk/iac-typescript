import {TerraformVariable} from 'cdktf';
import {regionNameCurrent} from "../modules/main";
import {cloudwatchLogGroupEcsTaskLogs} from "./../modules/ecs";
import {dbInstanceMain} from "./../modules/database";
import {ecrImageApi} from "./../modules/variables";

interface IContainerDefinition {
    name: string;
    image: TerraformVariable | string;
    essential: boolean;
    memoryReservation: number;
    environment: IEnvironment[];
    logConfiguration: ILogConfiguration;
    portMappings: IPortMapping[];
    mountPoints: IMountPoint[];
}

interface IMountPoint {
    readOnly: boolean;
    containerPath: string;
    sourceVolume: string;
}

interface IPortMapping {
    containerPort: number;
    hostPort: number;
}

interface ILogConfiguration {
    logDriver: string;
    options: {
        awslogsGroup: string;
        awslogsRegion: string;
        awslogsStreamPrefix: string;
    }
}

interface IEnvironment {
    name: string;
    value: string;
}

const apiContainerDefinition: IContainerDefinition ={
    name: "api",
    image: ecrImageApi,
    essential: true,
    memoryReservation: 256,
    environment: [
        {name: "DB_HOST", value: dbInstanceMain.address},
        {name: "DB_NAME", value: dbInstanceMain.name},
        {name: "DB_USER", value: dbInstanceMain.username},
        {name: "DB_PASS", value: dbInstanceMain.password}
    ],
    logConfiguration: {
        logDriver: "awslogs",
        options: {
            awslogsGroup: cloudwatchLogGroupEcsTaskLogs.name,
            awslogsRegion: regionNameCurrent.name,
            awslogsStreamPrefix: "api"
        }
    },
    portMappings: [
        {
            containerPort: 8000,
            hostPort: 8000
        }
    ],
    mountPoints: [
        {
            readOnly: false,
            containerPath: "/vol/web",
            sourceVolume: "static"
        }
    ]
};

export default apiContainerDefinition;

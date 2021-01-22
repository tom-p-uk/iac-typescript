import {regionNameCurrent} from './../modules/main';
import {cloudwatchLogGroupEcsTaskLogs} from './../modules/ecs';
import {dbInstanceMain} from './../modules/database';
import {ecrImageApi} from './../modules/variables';

export default [
    {
        "name": "api",
        "image": ecrImageApi,
        "essential": true,
        "memoryReservation": 256,
        "environment": [
            {"name": "DB_HOST", "value": dbInstanceMain.address},
            {"name": "DB_NAME", "value": dbInstanceMain.name},
            {"name": "DB_USER", "value": dbInstanceMain.username},
            {"name": "DB_PASS", "value": dbInstanceMain.password}
        ],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": cloudwatchLogGroupEcsTaskLogs.name,
                "awslogs-region": regionNameCurrent.name,
                "awslogs-stream-prefix": "api"
            }
        },
        "portMappings": [
            {
                "containerPort": 8000,
                "hostPort": 8000
            }
        ],
        "mountPoints": [
            {
                "readOnly": false,
                "containerPath": "/vol/web",
                "sourceVolume": "static"
            }
        ]
    }
]

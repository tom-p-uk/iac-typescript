"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const taskExecRolePolicy = {
    Version: '2012-10-17',
    Statement: [
        {
            Effect: 'Allow',
            Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            Resource: '*'
        }
    ]
};
exports.default = taskExecRolePolicy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza0V4ZWNSb2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFza0V4ZWNSb2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsTUFBTSxrQkFBa0IsR0FBWTtJQUNoQyxPQUFPLEVBQUUsWUFBWTtJQUNyQixTQUFTLEVBQUU7UUFDUDtZQUNJLE1BQU0sRUFBRSxPQUFPO1lBQ2YsTUFBTSxFQUFFO2dCQUNKLDJCQUEyQjtnQkFDM0IsaUNBQWlDO2dCQUNqQyw0QkFBNEI7Z0JBQzVCLG1CQUFtQjtnQkFDbkIsc0JBQXNCO2dCQUN0QixtQkFBbUI7YUFDdEI7WUFDRCxRQUFRLEVBQUUsR0FBRztTQUNoQjtLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IElQb2xpY3kgZnJvbSAnLi9JUG9saWN5JztcblxuY29uc3QgdGFza0V4ZWNSb2xlUG9saWN5OiBJUG9saWN5ID0ge1xuICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ2VjcjpHZXRBdXRob3JpemF0aW9uVG9rZW4nLFxuICAgICAgICAgICAgICAgICdlY3I6QmF0Y2hDaGVja0xheWVyQXZhaWxhYmlsaXR5JyxcbiAgICAgICAgICAgICAgICAnZWNyOkdldERvd25sb2FkVXJsRm9yTGF5ZXInLFxuICAgICAgICAgICAgICAgICdlY3I6QmF0Y2hHZXRJbWFnZScsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgUmVzb3VyY2U6ICcqJ1xuICAgICAgICB9XG4gICAgXVxufTtcblxuZXhwb3J0IGRlZmF1bHQgdGFza0V4ZWNSb2xlUG9saWN5O1xuIl19
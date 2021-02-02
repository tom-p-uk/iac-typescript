"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assumeRolePolicy = {
    Version: '2012-10-17',
    Statement: [
        {
            Action: 'sts:AssumeRole',
            Principal: {
                Service: 'ecs-tasks.amazonaws.com'
            },
            Effect: 'Allow'
        }
    ]
};
exports.default = assumeRolePolicy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzdW1lUm9sZVBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFzc3VtZVJvbGVQb2xpY3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxNQUFNLGdCQUFnQixHQUFZO0lBQzlCLE9BQU8sRUFBRSxZQUFZO0lBQ3JCLFNBQVMsRUFBRTtRQUNQO1lBQ0ksTUFBTSxFQUFFLGdCQUFnQjtZQUN4QixTQUFTLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLHlCQUF5QjthQUNyQztZQUNELE1BQU0sRUFBRSxPQUFPO1NBQ2xCO0tBQ0o7Q0FDSixDQUFBO0FBRUQsa0JBQWUsZ0JBQWdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSVBvbGljeSBmcm9tICcuL0lQb2xpY3knO1xuXG5jb25zdCBhc3N1bWVSb2xlUG9saWN5OiBJUG9saWN5ID0ge1xuICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2Vjcy10YXNrcy5hbWF6b25hd3MuY29tJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93J1xuICAgICAgICB9XG4gICAgXVxufVxuXG5leHBvcnQgZGVmYXVsdCBhc3N1bWVSb2xlUG9saWN5O1xuIl19
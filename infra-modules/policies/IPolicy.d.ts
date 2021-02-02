interface IPolicy {
    Version: string;
    Statement: IStatement[];
}
interface IStatement {
    Effect: string;
    Action: string | string[];
    Resource?: string;
    Principal?: {
        Service: string;
    };
}
export default IPolicy;

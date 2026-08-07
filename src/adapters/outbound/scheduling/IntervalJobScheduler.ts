import type { JobScheduler } from "../../../ports/JobScheduler.js";
export class IntervalJobScheduler implements JobScheduler {
  private timer:NodeJS.Timeout|null=null;private running=false;
  constructor(private readonly intervalMs:number,private readonly onError:(error:unknown)=>void){}
  start(job:()=>Promise<void>):void{if(this.timer)return;const run=async()=>{if(this.running)return;this.running=true;try{await job();}catch(error){this.onError(error);}finally{this.running=false;}};this.timer=setInterval(run,this.intervalMs);this.timer.unref();void run();}
  stop():void{if(this.timer)clearInterval(this.timer);this.timer=null;}
}

import type { GameState } from "@/lib/game-state";
import { HOUSES } from "@/lib/game-data";
import { currentRole } from "@/lib/careers";
import { marketUnlocked } from "@/lib/investing";

export type Letter = { id: number; day: number; from: string; subject: string; body: string; category: "family"|"career"|"town"|"finance"; response?: boolean };
export const hasRead = (s:GameState,id:number) => Boolean(((s.mailReadMask??0) & (1<<id)) !== 0);
export const unreadCount = (s:GameState) => mailFor(s).filter(l=>!hasRead(s,l.id)).length;
export const markRead = (s:GameState,id:number):GameState => ({...s,mailReadMask:(s.mailReadMask??0)|(1<<id)});
/** Writing prepares a letter; mailing it requires visiting the Post Office. */
export const hasDraftReply = (s:GameState,id:number) => Boolean((s.pendingReplyMask??0)&(1<<id));
export const replyFamily = (s:GameState,id:number):GameState => ({
  ...markRead(s,id),
  pendingReplyMask:(s.pendingReplyMask??0)|(1<<id),
});
export const sendPendingReplies = (s:GameState):GameState => {
  const pending = (s.pendingReplyMask??0) & ~(s.familyReplyMask??0);
  if (!pending) return s;
  return {
    ...s,
    pendingReplyMask:0,
    familyReplyMask:(s.familyReplyMask??0)|pending,
    familyFirstReplyDay:s.familyFirstReplyDay||s.day,
  };
};
export const hasReplied = (s:GameState,id:number) => Boolean((s.familyReplyMask??0)&(1<<id));

/** Deterministic lifetime correspondence. Nothing is lost while a mailbox is unregistered. */
export function mailFor(s:GameState):Letter[] {
  const letters:Letter[]=[
    {id:0,day:2,from:"Mum",subject:"Just checking in",category:"family",response:true,
      body:"Hi sweetheart. Hope you're getting settled in. Let me know where you're staying when you get the chance. Make sure you're eating something proper. Love, Mum."},
    {id:1,day:4,from:"Town Council",subject:"Welcome to Stick Town",category:"town",
      body:"Congratulations on becoming a resident! The council reminds you that cardboard is technically not a listed building. Please refrain from adding a conservatory."},
    {id:2,day:7,from:"Mum",subject:"Did you get my letter?",category:"family",response:true,
      body:"Just wondering whether the first letter reached you. Sarah says you're probably busy. We're both rooting for you. Write when you can. Love, Mum."},
    {id:3,day:11,from:"Sarah",subject:"Mum keeps asking",category:"family",response:true,
      body:"Hey. Mum keeps asking whether you've written. I told her you probably haven't sorted an address yet. Could you let us know you're okay? It's getting awkward making excuses for you. Sarah."},
    {id:4,day:15,from:"The Pigeon Association",subject:"Formal complaint",category:"town",
      body:"Your lack of breadcrumb provision has been noted. We expect better from someone with such an excellent selection of benches nearby. Yours, The Pigeon Association."},
    {id:5,day:18,from:"Mum",subject:"Hope everything is alright",category:"family",response:true,
      body:s.familyFirstReplyDay&&s.familyFirstReplyDay<15
        ?"Your letter meant the world. Sarah was being dramatic as usual. We're all alright here. You know the kettle's always on. Love, Mum."
        :"I hope you're alright. It's hard not knowing how you're getting on. I don't want to nag, I just miss hearing from you. Love, Mum."},
    {id:6,day:24,from:"Sarah",subject:"Please don't disappear",category:"family",response:true,
      body:s.familyFirstReplyDay
        ?"Thanks for writing. Mum's much happier now. Try not to leave it quite so long next time, alright?"
        :"You can't just vanish and expect everybody back home to be fine with it. Mum's worried sick. Please, just write something. Sarah."},
    {id:7,day:30,from:"Stick Town Utilities",subject:"Important announcement",category:"town",
      body:"Due to overwhelming public demand, we have decided not to install a fourth traffic light. Our research indicates the pigeons strongly oppose it."},
  ];
  if(s.house>=1)letters.push({id:8,day:s.day,from:"Town Property Management",subject:"Congratulations on your new home!",category:"finance",
    body:`Your property upgrade to ${HOUSES[s.house]?.name??"your new home"} is recorded. You can now consider more home furnishings at Cosy Corner.`});
  if(s.employed && (s.job>0||s.xp>=100))letters.push({id:9,day:s.day,from:"Your employer",subject:"Your career is progressing",category:"career",
    body:`Congratulations on your progress as ${currentRole(s).name}. Check your workplace for promotions, and consider improving your living arrangements to support future advancement.`});
  if(s.loanDebt&&s.loanDebt>0)letters.push({id:10,day:s.day,from:"Town Bank",subject:"Loan account reminder",category:"finance",
    body:`You have an outstanding balance of $${s.loanDebt}. Your repayment deadline is day ${s.loanDueDay??"—"}. Speak to the bank teller to arrange repayment.`});
  if(marketUnlocked(s))letters.push({id:11,day:s.day,from:"MegaCorp · Financial Development",subject:"Ever thought about owning shares?",category:"career",
    body:"You\u2019ve demonstrated the analytical skills needed to understand financial markets. Buy a laptop at Cosy Corner and use your home study desk to trade shares. Prices change daily, so your investments can lose money as well as gain it."});
  if(s.day>=30)letters.push({id:12,day:30,from:"Site Foreman · Workers Yard",subject:"We've moved — new yard east of Town Police",category:"career",
    body:"Town Hall is finished, so we've cleared out the old site. The whole Workers Yard — my office, the vacancies board and all construction contracts — is now east of the police station. Your construction job hasn't changed. It's a long walk, so check Town Transit about a licence and ask me about the old company car when you're a Site Lead. See you at the new yard. — Foreman."});
  if(s.companyCar && s.abandonedCar && (s.wreckRepairs??0)>=3)letters.push({id:13,day:s.day,from:"Site Foreman",subject:"Guess you won't need those keys anymore",category:"career",body:"Heard you've got your own wheels now. Guess you won't need those company car keys anymore. Drop them off whenever. Actually, don't bother. I've changed the locks. — Foreman."});
  if((s.medicalDebt??0)>0)letters.push({id:14,day:s.day,from:"Stick Town Hospital",subject:"Your very expensive nap",category:"finance",body:`Your hospital bill is ${s.medicalDebt}. We accept instalments. Please stop attempting to outsmart sleep.`});
  return letters.filter(l=>l.day<=s.day).sort((a,b)=>b.day-a.day || b.id-a.id);
}

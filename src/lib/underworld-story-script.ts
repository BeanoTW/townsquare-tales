import type {GameState} from "@/lib/game-state";
export type InvestigationApproach="observe"|"ask"|"improvise";
export type InvestigationBeat={label:string;response:string;required?: "strength"|"intelligence"|"charm";};
export type StoryScript={intro:string;scene:string;philosophy:string;locationName:string;clues:readonly [InvestigationBeat,InvestigationBeat,InvestigationBeat];returnLine:string;epilogue:string;};
export const UNDERWORLD_SCRIPTS:Readonly<Record<number,StoryScript>>={
 1:{intro:"Nia is staring at a ledger like it has personally insulted her. Mick keeps insisting the missing money is a matter of national security. It is eleven dollars and a coupon for soup.",
 scene:"The pawn clerk has a notebook full of crossed-out numbers and an impressive collection of biscuit crumbs.",
 philosophy:'Lez: "Money is just a number we all agree to be upset about." Nia: "And somehow we are upset about eleven of them."',
 locationName:"Oddities Pawn",clues:[
 {label:"Watch the clerk",response:"He counts the till twice, then puts the soup coupon in the cash drawer. He looks guilty about neither."},
 {label:"Ask about the figures",response:"The clerk admits Mick has been charging himself a consulting fee for advice nobody requested.",required:"intelligence"},
 {label:"Invent an official audit",response:"You announce that the Soup Commission is investigating. The clerk immediately produces a receipt.",required:"charm"}],
 returnLine:'Nia: "Tell me you found something better than a soup coupon."',
 epilogue:"Mick declares the investigation a triumph. Nia points out he was the entire financial crisis."},
 2:{intro:"Lez has spotted a mysterious bloke watching a house. The bloke has been there for three days. Lez has been watching him for four.",
 scene:"Outside the diner, the suspected stalker is staring at a handwritten sign advertising pies.",
 philosophy:'Lez: "If someone watches a watcher, which one is wasting their life?" Mick: "Both of you. Come help me shift this fridge."',
 locationName:"Diner",clues:[
 {label:"Keep an eye on him",response:"He checks the pie sign every ten minutes. Perhaps the real crime is their spelling."},
 {label:"Ask what he wants",response:"The stranger is waiting for his brother to finish a shift. His brother quit two years ago.",required:"charm"},
 {label:"Act like you own the pavement",response:"He steps aside apologetically, then asks whether you know when the steak pies arrive.",required:"strength"}],
 returnLine:'Lez: "Well? Is he a danger to the public or just a danger to himself?"',
 epilogue:"Lez decides everyone was right to be suspicious, including the stranger, who was suspicious of the pies."},
 3:{intro:"Mick announces a high-stakes collection operation. Nia asks if he has remembered the last four attempts. He says those were reconnaissance.",
 scene:"The shopkeeper has the envelope but refuses to surrender it until Mick apologises for borrowing his wheelbarrow.",
 philosophy:'Lez: "An apology is weird. You give away a bit of your pride and somehow end up with more of it." Mick: "I am not giving anybody my pride."',
 locationName:"Corner Shop",clues:[
 {label:"Wait for the shop to quiet down",response:"You overhear that Mick returned the wheelbarrow with a lawnmower tied to it."},
 {label:"Untangle the arrangement",response:"The shopkeeper only wants the wheelbarrow returned without any extra garden machinery.",required:"intelligence"},
 {label:"Offer an outrageous compromise",response:"You propose joint ownership of the wheelbarrow. Nobody is sure whether you are joking.",required:"charm"}],
 returnLine:'Mick: "Did you get the envelope, or have you formed a wheelbarrow union?"',
 epilogue:"Mick refuses to apologise. Then he does, quietly, when nobody is listening."},
 4:{intro:"Nia has been offered an absurd sum for a perfectly ordinary parcel. Mick calls it capitalism. Lez calls it a sign from the universe.",
 scene:"The buyer is sitting alone in the pub wearing sunglasses indoors. He claims he is being discreet.",
 philosophy:"Lez: \"Everyone's got a price.\" Nia: \"You sold a bicycle for half a sandwich.\" Lez: \"It was a good sandwich.\"",
 locationName:"The Tipsy Stick",clues:[
 {label:"Study the buyer's behaviour",response:"He keeps checking the wrong door. He has never been inside this pub before."},
 {label:"Ask where the money came from",response:"He says he inherited it from an uncle who is, by his own account, still alive.",required:"intelligence"},
 {label:"Pretend to be his accountant",response:"The buyer confesses he confused this parcel with a different deal altogether.",required:"charm"}],
 returnLine:'Nia: "Whatever you found out, tell me before Mick starts spending the money."',
 epilogue:"The buyer leaves poorer, wiser and without ever removing his sunglasses."},
 5:{intro:"Lez asks you for a late-night favour in an unusually solemn voice. Then he checks whether tomorrow is actually Tuesday.",
 scene:"In the alley is a battered shopping trolley containing a plant, a birthday card and a single traffic cone.",
 philosophy:'Lez: "People spend their whole life trying to get somewhere. Sometimes the important thing is who pushes the trolley with you."',
 locationName:"Alley",clues:[
 {label:"Examine the contents",response:"The birthday card is addressed to someone Lez has not seen in years. The plant is barely alive."},
 {label:"Read the note carefully",response:"The message is an apology. Lez could not bring himself to deliver it.",required:"intelligence"},
 {label:"Carry the trolley back yourself",response:"You bring the ridiculous little collection back without losing the plant or the cone.",required:"strength"}],
 returnLine:'Lez: "Did you get it? Nah, don't tell me yet. I need a second."',
 epilogue:"Nobody cracks a joke for a moment. Then Mick asks who stole his traffic cone. It turns out nobody had."}
};
export function investigationLine(id:number,choice:InvestigationApproach,s:GameState){
 const idx={observe:0,ask:1,improvise:2}[choice];
 const beat=UNDERWORLD_SCRIPTS[id]?.clues[idx];
 if(!beat)return null;
 const value=beat.required==="strength"?s.str:beat.required==="intelligence"?s.int:beat.required==="charm"?s.cha:0;
 if(beat.required&&value<20)return {message:"You try, but it doesn't quite land. "+UNDERWORLD_SCRIPTS[id]!.clues[0].response,clue:1};
 return {message:beat.response,clue:idx+1};
}

import type { PlaceId, Room } from "@/lib/rooms";

type Props = { room: Room; shirt: string; title: string };

function PropsForVenue({ id }: { id: PlaceId }) {
  switch (id) {
    case "shop":
      return <g>
        <rect x="13" y="23" width="115" height="110" rx="4" fill="#745441" stroke="#302c32" strokeWidth="5"/>
        {[43,75,107].map((y,i)=><g key={y}><path d={`M20 ${y+17}H120`} stroke="#efcc89" strokeWidth="4"/>{[0,1,2,3].map((j)=><rect key={j} x={24+j*24} y={y-7} width="15" height="21" rx="3" fill={["#e1a84c","#ae687a","#92bdb1"][(i+j)%3]}/>)}</g>)}
        <rect x="315" y="41" width="80" height="61" fill="#8b6f53" stroke="#343039" strokeWidth="4"/>
        <rect x="323" y="47" width="63" height="34" fill="#cde0cb"/>
        <text x="355" y="69" textAnchor="middle" fontWeight="bold" fontSize="12" fill="#c85643">SALE</text>
      </g>;
    case "diner":
      return <g>
        <rect x="18" y="24" width="133" height="82" fill="#f8e8cc" stroke="#b54f4b" strokeWidth="5"/>
        <rect x="26" y="30" width="117" height="43" fill="#344642"/>
        <text x="85" y="49" textAnchor="middle" fill="#f4d28b" fontSize="12" fontWeight="bold">SPECIALS</text>
        <path d="M40 57H128" stroke="#f4d28b" strokeWidth="3"/>
        <path d="M310 110V53Q310 39 328 39H384Q397 39 397 53V110Z" fill="#b63e42" stroke="#583838" strokeWidth="5"/>
        <path d="M310 82H397" stroke="#f3b3a7" strokeWidth="5"/>
        <ellipse cx="65" cy="155" rx="45" ry="17" fill="#fff4db" stroke="#5b3d39" strokeWidth="4"/>
      </g>;
    case "bank":
      return <g>
        <rect x="13" y="20" width="126" height="110" rx="5" fill="#3b665d" stroke="#263d38" strokeWidth="5"/>
        <circle cx="76" cy="73" r="39" fill="#a8c4b8" stroke="#263d38" strokeWidth="4"/>
        <circle cx="76" cy="73" r="12" fill="#f3e6c3" stroke="#263d38" strokeWidth="3"/>
        <path d="M76 39V109M42 73H109" stroke="#263d38" strokeWidth="4"/>
        <rect x="307" y="25" width="94" height="100" fill="#cfe3cf" stroke="#385a50" strokeWidth="5"/>
        {[321,349,377].map((x)=><path key={x} d={`M${x} 25V125`} stroke="#63847b" strokeWidth="5"/>)}
        <text x="350" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2b554a">TELLER</text>
      </g>;
    case "school":
      return <g>
        <rect x="16" y="23" width="177" height="93" fill="#365a4b" stroke="#7e573e" strokeWidth="8"/>
        <text x="104" y="50" fill="#f3ecc7" fontWeight="bold" fontSize="14" textAnchor="middle">STICK U</text>
        <path d="M40 68H163M44 84H151" stroke="#f3ecc7" strokeWidth="3"/>
        <rect x="302" y="26" width="92" height="103" fill="#946744" stroke="#473a30" strokeWidth="4"/>
        {[52,79,105].map((y)=><path key={y} d={`M303 ${y}H392`} stroke="#e9c784" strokeWidth="6"/>)}
        {[0,1,2].map((n)=><rect key={n} x={320+n*23} y="31" width="15" height="18" fill={["#b6bdcd","#d8a171","#91b8a0"][n]}/>)}
      </g>;
    case "work":
      return <g>
        {[12,77,142].map((x)=><rect key={x} x={x} y="23" width="55" height="91" fill="#a5d8e2" stroke="#516c83" strokeWidth="4"/>)}
        <rect x="293" y="27" width="109" height="97" fill="#496e84" stroke="#293b50" strokeWidth="4"/>
        <rect x="302" y="36" width="92" height="51" fill="#b1dedb"/>
        <text x="348" y="67" fontSize="12" textAnchor="middle" fontWeight="bold" fill="#315779">OFFICE</text>
        <rect x="20" y="134" width="119" height="22" fill="#977457" stroke="#344357" strokeWidth="4"/>
        <rect x="45" y="103" width="60" height="30" fill="#304658" stroke="#344357" strokeWidth="3"/>
        <rect x="50" y="107" width="50" height="20" fill="#82bcc7"/>
      </g>;
    case "yard":
      return <g>
        <path d="M20 18V135M125 18V135M20 28H125M20 72H125M20 116H125" stroke="#9b744d" strokeWidth="8"/>
        <path d="M20 18L125 135M125 18L20 135" stroke="#deb24e" strokeWidth="4"/>
        <path d="M297 125L332 31L367 125Z" fill="#e8b849" stroke="#473a33" strokeWidth="5"/>
        <rect x="370" y="46" width="38" height="74" fill="#727570" stroke="#473a33" strokeWidth="4"/>
        <path d="M375 64H403M375 87H403" stroke="#d6b55e" strokeWidth="5"/>
      </g>;
    case "bar":
      return <g>
        <rect x="16" y="21" width="158" height="107" fill="#46304f" stroke="#2d2934" strokeWidth="5"/>
        {[0,1,2,3,4].map((n)=><g key={n}><rect x={25+n*29} y={49+n%2*8} width="15" height="51" rx="3" fill={["#78c1ac","#dba04d","#bb77af"][n%3]} stroke="#2e2935" strokeWidth="2"/><path d={`M${32+n*29} 40V49`} stroke="#cfc1bc" strokeWidth="6"/></g>)}
        <rect x="284" y="30" width="118" height="54" rx="8" fill="#343048" stroke="#ef9ac2" strokeWidth="5"/>
        <text x="343" y="64" fill="#f5b7dc" fontSize="24" fontWeight="bold" textAnchor="middle">OPEN</text>
      </g>;
    case "pawn":
      return <g>
        <rect x="15" y="22" width="144" height="109" fill="#715c43" stroke="#45372e" strokeWidth="5"/>
        <path d="M16 69H157M16 107H157" stroke="#edc77c" strokeWidth="5"/>
        <circle cx="54" cy="47" r="19" fill="#e8d7ab" stroke="#45372e" strokeWidth="3"/>
        <path d="M54 37V47L64 55" stroke="#45372e" strokeWidth="3" fill="none"/>
        <path d="M95 35L124 28L141 55L126 94L105 86Z" fill="#d3a65e" stroke="#45372e" strokeWidth="3"/>
        <rect x="307" y="37" width="86" height="86" rx="6" fill="#947a56" stroke="#473b31" strokeWidth="5"/>
        <text x="350" y="87" fontSize="17" textAnchor="middle" fill="#ffeca9">ANTIQUES</text>
      </g>;
    case "clinic":
      return <g>
        <path d="M16 19V128H138V19" stroke="#68a596" strokeWidth="6" fill="#e8f2ee"/>
        <path d="M52 19Q70 52 52 87T52 128M100 19Q118 52 100 87T100 128" stroke="#b1dacb" strokeWidth="6" fill="none"/>
        <rect x="299" y="25" width="97" height="101" fill="#f3f6ed" stroke="#579b88" strokeWidth="5"/>
        <path d="M335 47H359V63H375V87H359V103H335V87H319V63H335Z" fill="#ce6061"/>
      </g>;
    case "depot":
      return <g>
        <rect x="12" y="21" width="180" height="107" rx="4" fill="#293f47" stroke="#243d43" strokeWidth="5"/>
        <text x="102" y="44" textAnchor="middle" fill="#f4d070" fontSize="14" fontWeight="bold">DEPARTURES</text>
        {[0,1,2].map((n)=><g key={n}><path d={`M24 ${55+n*23}H181`} stroke="#617d87" strokeWidth="2"/><text x="31" y={72+n*23} fill="#dbe9e4" fontSize="12">ROUTE {n+1}</text><text x="172" y={72+n*23} textAnchor="end" fill="#f3d781" fontSize="10">WAIT</text></g>)}
        <rect x="304" y="40" width="94" height="71" fill="#b9dbe0" stroke="#55727e" strokeWidth="4"/>
        <path d="M299 141H408M312 141V168M394 141V168" stroke="#4b5e6b" strokeWidth="7"/>
      </g>;
    case "police":
      return <g>
        <rect x="15" y="23" width="150" height="97" fill="#e7e5da" stroke="#42566c" strokeWidth="5"/>
        <text x="91" y="42" fill="#39404e" textAnchor="middle" fontWeight="bold" fontSize="13">WANTED</text>
        {[0,1,2].map((n)=><g key={n}><rect x={27+n*43} y="52" width="34" height="43" fill="#b3c1cc" stroke="#42566c" strokeWidth="2"/><circle cx={44+n*43} cy="69" r="8" fill="#d9b992"/><path d={`M${32+n*43} 88Q${44+n*43} 75 ${56+n*43} 88`} fill="#637d97"/></g>)}
        <rect x="297" y="22" width="105" height="116" fill="#7c92aa" stroke="#3a4e66" strokeWidth="5"/>
        {[314,341,368,395].map((x)=><path key={x} d={`M${x} 23V137`} stroke="#3a4e66" strokeWidth="5"/>)}
      </g>;
    case "furniture":
      return <g>
        <path d="M15 133Q15 92 48 92H111Q148 92 148 133V155H15Z" fill="#b77766" stroke="#49372f" strokeWidth="5"/>
        <path d="M28 114Q28 103 49 103H111Q135 103 135 114V139H28Z" fill="#dbb29b" stroke="#49372f" strokeWidth="3"/>
        <path d="M22 155V168M143 155V168" stroke="#49372f" strokeWidth="6"/>
        <path d="M358 61V153M337 153H379" stroke="#49372f" strokeWidth="5"/>
        <path d="M330 61L342 29H374L385 61Z" fill="#f2d394" stroke="#49372f" strokeWidth="4"/>
      </g>;
    default: return null;
  }
}

function Employee({ room, shirt }: { room: PlaceId; shirt: string }) {
  const uniform = ["yard","police","diner","clinic"].includes(room);
  return <g transform="translate(220 58)" stroke="#302a35" strokeWidth="4" strokeLinecap="round">
    <ellipse cy="131" rx="39" ry="7" fill="#302a35" stroke="none" opacity=".18"/>
    <path d="M-26 113L-21 76H21L26 113" fill="#434053"/>
    <path d="M-32 66L-43 99M32 66L43 99" fill="none" strokeWidth="7"/>
    <path d="M-31 57Q0 43 31 57L24 104H-24Z" fill={shirt}/>
    {room==="diner"&&<path d="M-20 69H20V104H-20Z" fill="#f7efe4" strokeWidth="2"/>}
    {room==="clinic"&&<path d="M-20 59L-11 102M20 59L11 102" stroke="#f4faf0" strokeWidth="10"/>}
    {room==="work"&&<path d="M0 55L-6 69L0 88L6 69Z" fill="#f5e3ba" strokeWidth="2"/>}
    <circle cy="28" r="26" fill="#eac89e"/>
    {uniform?<path d="M-27 17Q-22 -14 0 -14Q26 -12 27 17L36 23H-36Z" fill={room==="yard"?"#f0c04e":room==="police"?"#314f78":"#f2f4e9"}/>:<path d="M-26 23Q-31 -8 0 -12Q25 -9 27 23Q13 7 -4 7L-24 28Z" fill="#39323a"/>}
    <circle cx="-8" cy="28" r="2.5" fill="#302a35" stroke="none"/><circle cx="9" cy="28" r="2.5" fill="#302a35" stroke="none"/>
    <path d="M-9 40Q0 47 9 40" fill="none" stroke="#a57368" strokeWidth="2.5"/>
  </g>;
}

export function VenueScenery({ room, shirt, title }: Props) {
  return <div className={`arcade-set arcade-set-${room.id}`} aria-hidden="true">
    <svg className="venue-world" viewBox="0 0 420 210" preserveAspectRatio="xMidYMid slice">
      <rect width="420" height="210" fill={room.palette.wall}/>
      <path d="M0 0L70 113H350L420 0" fill={room.palette.wall} stroke="#3a323c" strokeOpacity=".35" strokeWidth="3"/>
      <path d="M0 210L70 113H350L420 210Z" fill={room.palette.floor} stroke="#38303a" strokeWidth="4"/>
      <path d="M70 113L0 210M350 113L420 210M210 113V210" fill="none" stroke="#39313a" strokeOpacity=".24" strokeWidth="3"/>
      {[151,179].map((y)=><path key={y} d={`M${70-(y-113)*.73} ${y}H${350+(y-113)*.73}`} stroke="#39313a" strokeOpacity=".17" strokeWidth="3"/>)}
      <PropsForVenue id={room.id}/>
      <Employee room={room.id} shirt={shirt}/>
      <path d="M155 162L181 148H285L310 162V195H155Z" fill={room.palette.accent} stroke="#302a35" strokeWidth="4"/>
      <path d="M155 162H310L286 174H179Z" fill="#e7c38a" stroke="#302a35" strokeWidth="3"/>
      {room.id==="shop"&&<g><rect x="271" y="139" width="31" height="26" rx="3" fill="#43424c" stroke="#302a35" strokeWidth="3"/><rect x="276" y="144" width="21" height="12" fill="#a2cab4"/></g>}
      <text x="212" y="14" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3a3039" letterSpacing="1">{title}</text>
    </svg>
  </div>;
}

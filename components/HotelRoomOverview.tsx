import React from "react";

export function HotelRoomOverview() {
  return (
    <figure className="relative w-full overflow-hidden rounded-[2rem] border border-[#d8cdbd] bg-[#e8dfd1] shadow-[0_30px_90px_rgba(66,48,32,0.16)]">
      <svg
        viewBox="0 0 1200 800"
        role="img"
        aria-labelledby="hotel-room-title hotel-room-description"
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title id="hotel-room-title">A warm hotel room with a bedside phone</title>
        <desc id="hotel-room-description">
          A front-facing bed sits between two nightstands. A black hotel phone
          and an amber bedside control panel are visible on the left.
        </desc>

        <defs>
          <linearGradient id="room-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f0e8" />
            <stop offset="1" stopColor="#e8dece" />
          </linearGradient>
          <linearGradient id="room-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b49d82" />
            <stop offset="1" stopColor="#7b624c" />
          </linearGradient>
          <linearGradient id="headboard" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b6b50" />
            <stop offset="1" stopColor="#5e4434" />
          </linearGradient>
          <linearGradient id="duvet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf8" />
            <stop offset="1" stopColor="#ded5c7" />
          </linearGradient>
          <linearGradient id="throw" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b99c73" />
            <stop offset="1" stopColor="#8c6d4b" />
          </linearGradient>
          <radialGradient id="lamp-glow">
            <stop offset="0" stopColor="#f4c77b" stopOpacity="0.48" />
            <stop offset="1" stopColor="#f4c77b" stopOpacity="0" />
          </radialGradient>
          <filter id="room-shadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#4b3829" floodOpacity="0.2" />
          </filter>
          <filter id="device-shadow" x="-50%" y="-50%" width="200%" height="220%">
            <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#251e19" floodOpacity="0.32" />
          </filter>
          <pattern id="carpet-weave" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M0 18 18 0M-5 5 5-5M13 23 23 13" stroke="#d7c7b2" strokeOpacity="0.15" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Architectural shell */}
        <rect width="1200" height="635" fill="url(#room-wall)" />
        <rect y="635" width="1200" height="165" fill="url(#room-floor)" />
        <rect y="635" width="1200" height="165" fill="url(#carpet-weave)" />
        <path d="M0 635H1200" stroke="#634936" strokeOpacity="0.5" strokeWidth="7" />
        <path d="M42 0V635M1158 0V635" stroke="#c3b39f" strokeOpacity="0.55" strokeWidth="2" />
        <path d="M58 55H1142V607H58Z" fill="none" stroke="#d2c6b6" strokeWidth="2" />

        {/* Soft lamp light */}
        <ellipse cx="178" cy="358" rx="220" ry="260" fill="url(#lamp-glow)" />
        <ellipse cx="1022" cy="358" rx="220" ry="260" fill="url(#lamp-glow)" />

        {/* Wall art */}
        <g opacity="0.88">
          <rect x="89" y="105" width="178" height="160" rx="3" fill="#6c503d" />
          <rect x="99" y="115" width="158" height="140" fill="#d9c5a7" />
          <path d="M107 238 148 171l28 38 34-61 39 90Z" fill="#9a7958" opacity="0.74" />
          <circle cx="141" cy="151" r="15" fill="#f2ddaa" opacity="0.9" />

          <rect x="933" y="105" width="178" height="160" rx="3" fill="#6c503d" />
          <rect x="943" y="115" width="158" height="140" fill="#d9c5a7" />
          <path d="M951 238 985 189l28 25 34-70 46 94Z" fill="#9a7958" opacity="0.74" />
          <circle cx="1060" cy="151" r="15" fill="#f2ddaa" opacity="0.9" />
        </g>

        {/* Headboard */}
        <g filter="url(#room-shadow)">
          <rect x="286" y="166" width="628" height="351" rx="12" fill="url(#headboard)" />
          <path d="M443 166V517M600 166V517M757 166V517" stroke="#a28468" strokeOpacity="0.38" strokeWidth="3" />
          <path d="M286 326H914" stroke="#4d362a" strokeOpacity="0.4" strokeWidth="3" />
          <rect x="303" y="183" width="594" height="317" rx="5" fill="none" stroke="#b29678" strokeOpacity="0.2" strokeWidth="2" />
        </g>

        {/* Nightstands */}
        <g filter="url(#room-shadow)">
          <path d="M76 478H279L264 656H91Z" fill="#604333" />
          <rect x="65" y="461" width="225" height="25" rx="4" fill="#77543e" />
          <path d="M103 656 97 707M251 656l6 51" stroke="#493124" strokeWidth="13" strokeLinecap="round" />
          <rect x="102" y="520" width="151" height="62" rx="3" fill="#674937" stroke="#89694e" strokeWidth="2" />
          <circle cx="178" cy="550" r="5" fill="#c49b5b" />

          <path d="M921 478H1124L1109 656H936Z" fill="#604333" />
          <rect x="910" y="461" width="225" height="25" rx="4" fill="#77543e" />
          <path d="M948 656 942 707M1096 656l6 51" stroke="#493124" strokeWidth="13" strokeLinecap="round" />
          <rect x="947" y="520" width="151" height="62" rx="3" fill="#674937" stroke="#89694e" strokeWidth="2" />
          <circle cx="1023" cy="550" r="5" fill="#c49b5b" />
        </g>

        {/* Lamps */}
        <g>
          <path d="M178 274V449" stroke="#8b6e4f" strokeWidth="8" />
          <path d="M140 449H216" stroke="#8b6e4f" strokeWidth="10" strokeLinecap="round" />
          <path d="M123 292h110l-20 90h-70Z" fill="#f5e5c5" stroke="#c5a978" strokeWidth="3" />
          <path d="M1022 274V449" stroke="#8b6e4f" strokeWidth="8" />
          <path d="M984 449H1060" stroke="#8b6e4f" strokeWidth="10" strokeLinecap="round" />
          <path d="M967 292h110l-20 90h-70Z" fill="#f5e5c5" stroke="#c5a978" strokeWidth="3" />
        </g>

        {/* Bedside control panel */}
        <g data-scene-object="bedside-panel" filter="url(#device-shadow)">
          <rect x="88" y="397" width="63" height="49" rx="7" fill="#252729" stroke="#86735d" strokeWidth="2" />
          <rect x="96" y="404" width="47" height="24" rx="3" fill="#b77d37" />
          <path d="M104 434h9M120 434h9M136 434h2" stroke="#e5bb77" strokeWidth="3" strokeLinecap="round" />
          <path d="M113 410c4-4 9-4 13 0" fill="none" stroke="#f4d59e" strokeWidth="2" strokeLinecap="round" />
          <path d="M115 414c3-2 6-2 9 0" fill="none" stroke="#f4d59e" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Hotel phone */}
        <g data-scene-object="hotel-phone" filter="url(#device-shadow)">
          <path d="M166 428h96l11 36H154Z" fill="#202426" stroke="#3e4345" strokeWidth="3" />
          <rect x="180" y="437" width="49" height="18" rx="3" fill="#777168" />
          <circle cx="244" cy="444" r="3.5" fill="#dc9c4c" />
          <path d="M168 415c4-15 16-22 30-22h39c14 0 25 7 30 22l-12 11c-8-7-16-10-25-10h-26c-9 0-17 3-25 10Z" fill="#15191b" stroke="#373c3f" strokeWidth="3" />
          <path d="M263 459c17 5 19 17 8 27-8 7-9 13-4 20" fill="none" stroke="#222628" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Bed frame and mattress */}
        <g filter="url(#room-shadow)">
          <path d="M313 416H887L949 704H251Z" fill="#5c4031" />
          <path d="M303 400H897L931 664Q934 688 907 691H293Q266 688 269 664Z" fill="url(#duvet)" />
          <path d="M330 383c4-51 37-83 86-87l164 14-23 133-229-5Z" fill="#fbf8f1" stroke="#d8cfc2" strokeWidth="3" />
          <path d="M870 383c-4-51-37-83-86-87l-164 14 23 133 229-5Z" fill="#fbf8f1" stroke="#d8cfc2" strokeWidth="3" />
          <path d="M378 404c5-45 31-72 70-74l126 9-16 104-181-3Z" fill="#fffdf8" stroke="#ddd4c8" strokeWidth="3" />
          <path d="M822 404c-5-45-31-72-70-74l-126 9 16 104 181-3Z" fill="#fffdf8" stroke="#ddd4c8" strokeWidth="3" />
          <path d="M269 528c98 23 198 34 331 34s233-11 331-34l-14 137Q915 679 898 680H302q-17-1-19-15Z" fill="#f2ede4" />
          <path d="M397 548c65 10 132 14 203 14s138-4 203-14l-8 136H405Z" fill="url(#throw)" />
          <path d="M426 553 416 681M466 557l-7 126M774 557l7 126M734 560l4 123" stroke="#d5bd99" strokeOpacity="0.34" strokeWidth="3" />
          <path d="M405 684h390" stroke="#684b36" strokeOpacity="0.46" strokeWidth="5" />
        </g>

        {/* Foreground rug edge */}
        <path d="M165 764c166-38 704-38 870 0" fill="none" stroke="#d8c6ad" strokeOpacity="0.45" strokeWidth="34" strokeLinecap="round" />
      </svg>

      <figcaption className="sr-only">
        Landline guest-room overview. The bedside phone and control panel will
        lead to a close-up view in the next phase.
      </figcaption>
    </figure>
  );
}

export function TopicArt({ topic, small = false }) {
  return (
    <svg
      className={`learn-art ${small ? "is-small" : ""}`}
      viewBox="0 0 360 168"
      fill="none"
      role="img"
      aria-label={
        {
          air: "แหล่งกำเนิดฝุ่นจากเมืองและการคมนาคม",
          water: "ระบบนิเวศทางน้ำตั้งแต่ชุมชนถึงแหล่งน้ำ",
          plastic: "เส้นทางของพลาสติกจากการใช้สู่อนุภาคขนาดเล็ก",
          climate: "ความสัมพันธ์ของแสงอาทิตย์ ความร้อน และพืช",
        }[topic]
      }
    >
      {topic === "air" && (
        <>
          <path d="M0 132h360v36H0z" fill="#bfdbc8" />
          <path
            d="M37 128V66h44v62M94 128V40h55v88M162 128V81h36v47M224 128V59h60v69M299 128V91h40v37"
            fill="#85b89a"
          />
          <path d="M95 40h54v88H95z" fill="#407d60" />
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2].map((col) => (
              <path
                key={`${row}${col}`}
                d={`M${105 + col * 14} ${53 + row * 18}h5v7h-5z`}
                fill="#d9eee0"
              />
            ))
          )}
          <path d="M41 142h284" stroke="#548b6a" strokeWidth="2" />
          <rect x="226" y="119" width="60" height="21" rx="5" fill="#356b54" />
          <circle cx="239" cy="141" r="5" fill="#233f33" />
          <circle cx="275" cy="141" r="5" fill="#233f33" />
          <path d="M240 112h28l10 10h-46z" fill="#69b5db" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <circle
              key={i}
              cx={28 + i * 36}
              cy={20 + (i % 3) * 11}
              r={2 + (i % 2)}
              fill="#6a8c75"
              opacity=".6"
            />
          ))}
          <path
            d="M178 39h36m-26-10h38M27 42h29"
            stroke="#83bba3"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {topic === "water" && (
        <>
          <path
            d="M0 77c80-29 123 30 205 3s102-16 155-2v90H0z"
            fill="#99d3e8"
          />
          <path
            d="M0 110c70-23 133 20 202 1s115-17 158 0v57H0z"
            fill="#6bb1d0"
          />
          <path
            d="M0 143c84-27 130 10 205-2s112-17 155-3v30H0z"
            fill="#438ba6"
          />
          <path d="M30 78V41h48v37m8 0V28h44v50" fill="#8dbb9d" />
          <path d="M139 66h38v18h25" stroke="#6d8990" strokeWidth="8" />
          <path
            d="M274 151c-11-32-4-47 3-61m11 60c3-23 11-33 23-40"
            stroke="#306e64"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M89 124c14-15 30-15 43 0-13 14-29 14-43 0m43 0 12-9v18z"
            fill="#e7f5fc"
          />
          <circle cx="99" cy="122" r="2" fill="#30617b" />
          <circle cx="229" cy="100" r="4" stroke="#e7f5fc" />
          <circle cx="246" cy="122" r="3" stroke="#e7f5fc" />
          <circle cx="220" cy="140" r="2" fill="#e7f5fc" />
          <path d="M314 51h22m-11-11v22" stroke="#83b3c8" strokeWidth="2" />
        </>
      )}
      {topic === "plastic" && (
        <>
          <path d="M0 143c80-8 127-18 202-1s103 8 158-6v32H0z" fill="#baded6" />
          <g transform="rotate(-15 91 86)">
            <rect x="76" y="34" width="30" height="12" rx="3" fill="#3d8375" />
            <path
              d="M76 48h30v12l9 16v58c0 7-8 9-24 9s-24-2-24-9V76l9-16z"
              fill="#74bdb0"
            />
            <path d="M68 90h46v30H68z" fill="#e9f6ef" />
            <path d="M82 98h20m-16 9h12" stroke="#5b9a8c" strokeWidth="3" />
          </g>
          <path
            d="M150 92h45m-10-8 10 8-10 8"
            stroke="#76aa9e"
            strokeWidth="2"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`m${225 + (i % 3) * 25} ${64 + Math.floor(i / 3) * 36} 8-3 6 11-9 7z`}
              fill={i % 2 ? "#75b6c7" : "#539d85"}
            />
          ))}
          <path
            d="M39 140c0-24-8-38-18-47m13 24-17-5"
            stroke="#659c83"
            strokeWidth="3"
          />
          <circle cx="309" cy="38" r="14" stroke="#bfded3" strokeWidth="2" />
        </>
      )}
      {topic === "climate" && (
        <>
          <circle cx="270" cy="53" r="27" fill="#edc580" />
          <g stroke="#d5ad6c" strokeWidth="2">
            {[0, 45, 90, 135].map((angle) => (
              <path
                key={angle}
                d="M270 14v-8m0 94v-8"
                transform={`rotate(${angle} 270 53)`}
              />
            ))}
          </g>
          <path
            d="M0 135c62-35 101-17 167-8s105-12 193 0v41H0z"
            fill="#bad7b7"
          />
          <path d="M0 159c99-29 140-5 208-5s89-12 152-9v23H0z" fill="#83b08a" />
          <path
            d="M84 37a10 10 0 0 1 20 0v65a22 22 0 1 1-20 0z"
            fill="#f5f5df"
            stroke="#608a70"
            strokeWidth="2"
          />
          <path
            d="M94 64v52"
            stroke="#d69a60"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="94" cy="123" r="12" fill="#d69a60" />
          <path
            d="M115 51h10m-10 18h7m-7 18h10"
            stroke="#83a289"
            strokeWidth="2"
          />
          <path
            d="M191 144v-36m0 20c-22 0-31-10-31-25 21 0 31 8 31 25m0-6c22 0 31-13 31-28-20 0-31 11-31 28"
            fill="#5e986b"
            stroke="#4f855c"
            strokeWidth="2"
          />
          <path
            d="m218 68-29 15m9-2-9 2 5-8"
            stroke="#c7ae73"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );
}

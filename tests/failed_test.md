(node:99668) Warning: `--localstorage-file` was provided without a valid path
(Use `node --trace-warnings ...` to show where the warning was created)
 ❯ tests/spells-modal.spec.tsx (2) 2098ms
   ❯ SpellsModal empowered variant UI (2) 2097ms
     × shows empowered variant locked for low-level characters when base learned 1064ms
     × shows empowered variant available and learn button for high-level characters when base learned 1033ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/spells-modal.spec.tsx > SpellsModal empowered variant UI > shows empowered variant locked for low-level characters when base learned
TestingLibraryElementError: Unable to find an element with the text: /Empowered variant locked/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body
  style="overflow: hidden;"
>
  <div>
    <div
      aria-modal="true"
      class="fixed inset-0 z-[70] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto "
      role="dialog"
    >
      <div
        class="max-h-[95vh] overflow-y-auto my-auto"
      >
        <div
          class="w-full max-w-[900px] h-[min(85vh,700px)] flex flex-col bg-skyrim-paper rounded border border-skyrim-border overflow-hidden"
        >
          <div
            class="flex items-center justify-between p-3 border-b border-skyrim-border bg-skyrim-dark/30"
          >
            <h3
              class="text-lg font-bold text-skyrim-gold flex items-center gap-2"
            >
              <svg
                aria-hidden="true"
                class="lucide lucide-zap"
                fill="none"
                height="18"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                />
              </svg>
               Spell Tome
            </h3>
            <div
              class="flex items-center gap-4"
            >
              <div
                class="text-sm text-skyrim-text"
              >
                Points: 
                <span
                  class="font-bold text-skyrim-gold"
                >
                  10
                </span>
                <span
                  class="ml-2 text-blue-300"
                >
                  (
                  1
                   in spells)
                </span>
              </div>
              <button
                class="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1"
              >
                <svg
                  aria-hidden="true"
                  class="lucide lucide-refresh-ccw"
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  />
                  <path
                    d="M3 3v5h5"
                  />
                  <path
                    d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                  />
                  <path
                    d="M16 16h5v5"
                  />
                </svg>
                 Refund All
              </button>
            </div>
          </div>
          <div
            class="flex flex-1 overflow-hidden"
          >
            <div
              class="w-1/2 border-r border-skyrim-border overflow-y-auto p-2"
            >
              <div
                class="mb-1"
              >
                <button
                  class="w-full flex items-center justify-between p-2 rounded hover:bg-skyrim-gold/10"
                >
                  <span
                    class="font-medium flex items-center gap-2 text-orange-400"
                  >
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-flame"
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      width="14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
                      />
                    </svg>
                    Destruction
                  </span>
                  <div
                    class="flex items-center gap-2"
                  >
                    <span
                      class="text-xs px-1.5 py-0.5 bg-amber-600/30 text-amber-300 rounded"
                    >
                      3
                    </span>
                    <span
                      class="text-xs px-1.5 py-0.5 bg-green-600/30 text-green-300 rounded"
                    >
                      1
                    </span>
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-chevron-down"

gnored nodes: comments, script, style
<body
  style="overflow: hidden;"
>
  <div>
    <div
      aria-modal="true"
      class="fixed inset-0 z-[70] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto "
      role="dialog"
    >
      <div
        class="max-h-[95vh] overflow-y-auto my-auto"
      >
        <div
          class="w-full max-w-[900px] h-[min(85vh,700px)] flex flex-col bg-skyrim-paper rounded border border-skyrim-border overflow-hidden"
        >
          <div
            class="flex items-center justify-between p-3 border-b border-skyrim-border bg-skyrim-dark/30"
          >
            <h3
              class="text-lg font-bold text-skyrim-gold flex items-center gap-2"
            >
              <svg
                aria-hidden="true"
                class="lucide lucide-zap"
                fill="none"
                height="18"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                />
              </svg>
               Spell Tome
            </h3>
            <div
              class="flex items-center gap-4"
            >
              <div
                class="text-sm text-skyrim-text"
              >
                Points: 
                <span
                  class="font-bold text-skyrim-gold"
                >
                  10
                </span>
                <span
                  class="ml-2 text-blue-300"
                >
                  (
                  1
                   in spells)
                </span>
              </div>
              <button
                class="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1"
              >
                <svg
                  aria-hidden="true"
                  class="lucide lucide-refresh-ccw"
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  />
                  <path
                    d="M3 3v5h5"
                  />
                  <path
                    d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                  />
                  <path
                    d="M16 16h5v5"
                  />
                </svg>
                 Refund All
              </button>
            </div>
          </div>
          <div
            class="flex flex-1 overflow-hidden"
          >
            <div
              class="w-1/2 border-r border-skyrim-border overflow-y-auto p-2"
            >
              <div
                class="mb-1"
              >
                <button
                  class="w-full flex items-center justify-between p-2 rounded hover:bg-skyrim-gold/10"
                >
                  <span
                    class="font-medium flex items-center gap-2 text-orange-400"
                  >
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-flame"
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      width="14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
                      />
                    </svg>
                    Destruction
                  </span>
                  <div
                    class="flex items-center gap-2"
                  >
                    <span
                      class="text-xs px-1.5 py-0.5 bg-amber-600/30 text-amber-300 rounded"
                    >
                      3
                    </span>
                    <span
                      class="text-xs px-1.5 py-0.5 bg-green-600/30 text-green-300 rounded"
                    >
                      1
                    </span>
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-chevron-down"
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ tests/spells-modal.spec.tsx:16:33
     14|     render(<SpellsModal character={lowLevelChar} onClose={() => {}} />);
     15| 
     16|     const locked = await screen.findAllByText(/Empowered variant locked/i);
       |                                 ^
     17|     expect(locked.length).toBeGreaterThan(0);
     18|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  tests/spells-modal.spec.tsx > SpellsModal empowered variant UI > shows empowered variant available and learn button for high-level characters when base learned
TestingLibraryElementError: Unable to find an element with the text: /Empowered variant available/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body
  style="overflow: hidden;"
>
  <div>
    <div
      aria-modal="true"
      class="fixed inset-0 z-[70] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto "
      role="dialog"
    >
      <div
        class="max-h-[95vh] overflow-y-auto my-auto"
      >
        <div
          class="w-full max-w-[900px] h-[min(85vh,700px)] flex flex-col bg-skyrim-paper rounded border border-skyrim-border overflow-hidden"
        >
          <div
            class="flex items-center justify-between p-3 border-b border-skyrim-border bg-skyrim-dark/30"
          >
            <h3
              class="text-lg font-bold text-skyrim-gold flex items-center gap-2"
            >
              <svg
                aria-hidden="true"
                class="lucide lucide-zap"
                fill="none"
                height="18"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                />
              </svg>
               Spell Tome
            </h3>
            <div
              class="flex items-center gap-4"
            >
              <div
                class="text-sm text-skyrim-text"
              >
                Points: 
                <span
                  class="font-bold text-skyrim-gold"
                >
                  10
                </span>
                <span
                  class="ml-2 text-blue-300"
                >
                  (
                  1
                   in spells)
                </span>
              </div>
              <button
                class="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1"
              >
                <svg
                  aria-hidden="true"
                  class="lucide lucide-refresh-ccw"
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  />
                  <path
                    d="M3 3v5h5"
                  />
                  <path
                    d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                  />
                  <path
                    d="M16 16h5v5"
                  />
                </svg>
                 Refund All
              </button>
            </div>
          </div>
          <div
            class="flex flex-1 overflow-hidden"
          >
            <div
              class="w-1/2 border-r border-skyrim-border overflow-y-auto p-2"
            >
              <div
                class="mb-1"
              >
                <button
                  class="w-full flex items-center justify-between p-2 rounded hover:bg-skyrim-gold/10"
                >
                  <span
                    class="font-medium flex items-center gap-2 text-orange-400"
                  >
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-flame"
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      width="14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
                      />
                    </svg>
                    Destruction
                  </span>
                  <div
                    class="flex items-center gap-2"
                  >
                    <span
                      class="text-xs px-1.5 py-0.5 bg-amber-600/30 text-amber-300 rounded"
                    >
                      6
                    </span>
                    <span
                      class="text-xs px-1.5 py-0.5 bg-green-600/30 text-green-300 rounded"
                    >
                      1
                    </span>
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-chevron-down"

gnored nodes: comments, script, style
<body
  style="overflow: hidden;"
>
  <div>
    <div
      aria-modal="true"
      class="fixed inset-0 z-[70] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto "
      role="dialog"
    >
      <div
        class="max-h-[95vh] overflow-y-auto my-auto"
      >
        <div
          class="w-full max-w-[900px] h-[min(85vh,700px)] flex flex-col bg-skyrim-paper rounded border border-skyrim-border overflow-hidden"
        >
          <div
            class="flex items-center justify-between p-3 border-b border-skyrim-border bg-skyrim-dark/30"
          >
            <h3
              class="text-lg font-bold text-skyrim-gold flex items-center gap-2"
            >
              <svg
                aria-hidden="true"
                class="lucide lucide-zap"
                fill="none"
                height="18"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                />
              </svg>
               Spell Tome
            </h3>
            <div
              class="flex items-center gap-4"
            >
              <div
                class="text-sm text-skyrim-text"
              >
                Points: 
                <span
                  class="font-bold text-skyrim-gold"
                >
                  10
                </span>
                <span
                  class="ml-2 text-blue-300"
                >
                  (
                  1
                   in spells)
                </span>
              </div>
              <button
                class="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1"
              >
                <svg
                  aria-hidden="true"
                  class="lucide lucide-refresh-ccw"
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  />
                  <path
                    d="M3 3v5h5"
                  />
                  <path
                    d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                  />
                  <path
                    d="M16 16h5v5"
                  />
                </svg>
                 Refund All
              </button>
            </div>
          </div>
          <div
            class="flex flex-1 overflow-hidden"
          >
            <div
              class="w-1/2 border-r border-skyrim-border overflow-y-auto p-2"
            >
              <div
                class="mb-1"
              >
                <button
                  class="w-full flex items-center justify-between p-2 rounded hover:bg-skyrim-gold/10"
                >
                  <span
                    class="font-medium flex items-center gap-2 text-orange-400"
                  >
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-flame"
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      width="14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
                      />
                    </svg>
                    Destruction
                  </span>
                  <div
                    class="flex items-center gap-2"
                  >
                    <span
                      class="text-xs px-1.5 py-0.5 bg-amber-600/30 text-amber-300 rounded"
                    >
                      6
                    </span>
                    <span
                      class="text-xs px-1.5 py-0.5 bg-green-600/30 text-green-300 rounded"
                    >
                      1
                    </span>
                    <svg
                      aria-hidden="true"
                      class="lucide lucide-chevron-down"
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ tests/spells-modal.spec.tsx:25:36
     23|     render(<SpellsModal character={highLevelChar} onClose={() => {}} />);
     24| 
     25|     const available = await screen.findAllByText(/Empowered variant available/i);
       |                                    ^
     26|     expect(available.length).toBeGreaterThan(0);
     27| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯

 Test Files  1 failed (1)
      Tests  2 failed (2)
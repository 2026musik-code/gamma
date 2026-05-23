/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chat } from "./components/Chat";

export default function App() {
  return (
    <main className="h-screen w-full bg-black p-4 md:p-8 flex items-center justify-center font-sans">
      <Chat />
    </main>
  );
}

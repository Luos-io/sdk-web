// @deno.types="https://denopkg.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/w3c-web-serial/index.d.ts"

navigator.connection;
navigator.serial.requestPort({}).then(() => {}).catch((e) => console.error('[Serial] Error', e));

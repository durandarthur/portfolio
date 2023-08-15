<script setup lang="ts"></script>

<template>
  <div class="h-full w-full contact">
    <label for="to" class="pl-4">Destinataire: </label>
    <input
      class="pl-2"
      type="email"
      name="to"
      id="to"
      placeholder="durandarthur09@outlook.fr"
      disabled
    />

    <div class="flex w-full h-full justify-end pr-4">
      <button type="submit" class="h-full w-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="{1.5}"
          class="stroke-slate-300 hover:stroke-white"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
          />
        </svg>
      </button>
    </div>

    <textarea
      class="message p-4 border-t border-slate-700"
      name="message"
      id="message"
      cols="30"
      rows="10"
      placeholder="Entrez votre message"
    ></textarea>
  </div>
</template>

<style lang="css" scoped>
.contact {
  display: grid;
  grid-template-columns: 3fr 24fr 2fr;
  grid-template-rows: 1fr 10fr;
  overflow-x: hidden;
}
.contact > * {
  /* border: 1px solid grey; */
  width: 100%;
  height: 100%;
}
.message {
  grid-column: span 3;
}
label {
  display: flex;
  align-items: center;
}
label,
input,
textarea {
  font-family: "Consolas";
  outline: none;
}
* {
  background-color: #111316;
  color: aliceblue;
}
</style>

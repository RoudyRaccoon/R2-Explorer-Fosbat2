<template>
  <q-list style="min-width: 100px">
    <q-item clickable v-close-popup @click="openObject">
      <q-item-section>Open</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="downloadObject" v-if="prop.row.type === 'file'">
      <q-item-section>Download</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="renameObject" v-if="prop.row.type === 'file'">
      <q-item-section>Rename</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="updateMetadataObject" v-if="prop.row.type === 'file'">
      <q-item-section>Update Metadata</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="shareObject">
      <q-item-section>Get sharable link</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="deleteObject">
      <q-item-section>Delete</q-item-section>
    </q-item>
  </q-list>
</template>

<script>
import { useQuasar } from "quasar";
import { encode } from "src/appUtils";
import { useMainStore } from "stores/main-store";

export default {
  name: "FileContextMenu",
  props: { prop: {} },
  setup() {
    return {
      mainStore: useMainStore(),
      q: useQuasar(),
    };
  },
  methods: {
    openObject() { this.$emit("openObject", this.prop.row); },
    deleteObject() { this.$emit("deleteObject", this.prop.row); },
    renameObject() { this.$emit("renameObject", this.prop.row); },
    updateMetadataObject() { this.$emit("updateMetadataObject", this.prop.row); },
    
    async shareObject() {
      try {
        // Fetch public URL from the worker
        const bucket = this.$route.params.bucket;
        const key = encode(this.prop.row.key);
        const res = await fetch(`${this.mainStore.serverUrl}/api/buckets/${bucket}/${key}?public=true`);
        const data = await res.json();

        if (data.url) {
          await navigator.clipboard.writeText(data.url);
          this.q.notify({ message: "Sharable link copied to clipboard!", color: "green" });
        } else {
          throw new Error("No URL returned");
        }
      } catch (err) {
        console.error(err);
        this.q.notify({ message: "Failed to get sharable link", color: "negative" });
      }
    },

    downloadObject() {
      const link = document.createElement("a");
      link.download = this.prop.row.name;
      link.href = `${this.mainStore.serverUrl}/api/buckets/${this.$route.params.bucket}/${encode(this.prop.row.key)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>

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

    shareObject: async function () {
      try {
        const baseUrl = "https://file.fosbat.art";

        // Split the R2 object key into segments
        const segments = this.prop.row.key.split("/");

        // Decode each segment individually if it's Base64
        const decodedSegments = segments.map(seg => {
          try {
            const decoded = atob(seg);
            // Only return if it looks like a valid filename
            if (/^[\w\s\-./]+$/.test(decoded)) {
              return decoded;
            }
            return seg;
          } catch {
            return seg; // not Base64
          }
        });

        // Join segments to form a proper path
        const path = decodedSegments.join("/");

        const url = `${baseUrl}/${path}`;

        await navigator.clipboard.writeText(url);
        this.q.notify({
          message: "Public R2 link copied to clipboard!",
          timeout: 5000,
          type: "positive",
        });
      } catch (err) {
        this.q.notify({
          message: `Failed to copy: ${err}`,
          timeout: 5000,
          type: "negative",
        });
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



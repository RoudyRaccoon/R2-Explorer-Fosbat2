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
import { decode, encode } from "src/appUtils";
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
    openObject() {
      this.$emit("openObject", this.prop.row);
    },
    deleteObject() {
      this.$emit("deleteObject", this.prop.row);
    },
    renameObject() {
      this.$emit("renameObject", this.prop.row);
    },
    updateMetadataObject() {
      this.$emit("updateMetadataObject", this.prop.row);
    },
    shareObject: async function () {
      try {
        // Public R2 domain
        const baseUrl = "https://file.fosbat.art";

        let path = this.prop.row.key;

        // Decode Base64 if needed
        try {
          const decoded = atob(path);
          if (/^[\w\s\-./]+$/.test(decoded)) {
            path = decoded;
          }
        } catch {
          // Not Base64, leave as-is
        }

        // Normalize folder paths
        path = path.replace(/\\/g, "/").replace(/^\/+/, "");

        // Construct sharable URL
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


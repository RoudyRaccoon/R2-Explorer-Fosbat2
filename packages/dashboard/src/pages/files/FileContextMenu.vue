<template>
  <q-list style="min-width: 100px">
    <q-item clickable v-close-popup @click="openObject">
      <q-item-section>Open</q-item-section>
    </q-item>
    <q-item
      clickable
      v-close-popup
      @click="downloadObject"
      v-if="prop.row.type === 'file'"
    >
      <q-item-section>Download</q-item-section>
    </q-item>
    <q-item
      clickable
      v-close-popup
      @click="renameObject"
      v-if="prop.row.type === 'file'"
    >
      <q-item-section>Rename</q-item-section>
    </q-item>
    <q-item
      clickable
      v-close-popup
      @click="updateMetadataObject"
      v-if="prop.row.type === 'file'"
    >
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
import { ROOT_FOLDER, decode, encode } from "src/appUtils";
import { useMainStore } from "stores/main-store";

export default {
  name: "FileContextMenu",
  props: {
    prop: {},
  },
  computed: {
    selectedBucket() {
      return this.$route.params.bucket;
    },
    selectedFolder() {
      if (
        this.$route.params.folder &&
        this.$route.params.folder !== ROOT_FOLDER
      ) {
        return decode(this.$route.params.folder);
      }
      return "";
    },
  },
  methods: {
    renameObject() {
      this.$emit("renameObject", this.prop.row);
    },
    updateMetadataObject() {
      this.$emit("updateMetadataObject", this.prop.row);
    },
    openObject() {
      this.$emit("openObject", this.prop.row);
    },
    deleteObject() {
      this.$emit("deleteObject", this.prop.row);
    },
    async shareObject() {
      try {
        // Build the clean public R2 link
        // Adjust `https://file.fosbat.art` to your custom domain
        const baseUrl = "https://file.fosbat.art";

        // Combine folder + file path
        const path = encodeURIComponent(this.prop.row.key); // R2 object key includes folders

        // Full public URL
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
      link.href = `${this.mainStore.serverUrl}/api/buckets/${this.selectedBucket}/${encode(
        this.prop.row.key
      )}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
  setup() {
    return {
      mainStore: useMainStore(),
      q: useQuasar(),
    };
  },
};
</script>
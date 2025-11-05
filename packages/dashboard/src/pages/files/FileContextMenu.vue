<template>
  <q-list style="min-width: 150px">
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
    downloadObject() {
      const link = document.createElement("a");
      link.download = this.prop.row.name;
      link.href = `${this.mainStore.serverUrl}/api/buckets/${this.$route.params.bucket}/${encode(this.prop.row.key)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    shareObject() {
  const directUrl = `${this.mainStore.r2PublicBaseUrl}/${encode(this.prop.row.key)}`;
  navigator.clipboard.writeText(directUrl);
  this.q.notify({ message: "Sharable link copied!", color: "green" });
}


  }
};
</script>


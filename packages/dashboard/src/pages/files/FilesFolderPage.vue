<template>
  <q-page class="">
    <div class="q-pa-md" ref="pageContainer" @scroll="handleScroll" style="height: 100vh; overflow-y: auto;">
      <q-breadcrumbs>
        <q-breadcrumbs-el
          v-for="obj in breadcrumbs"
          :key="obj.name"
          :label="obj.name"
          style="cursor: pointer"
          @click="breadcrumbsClick(obj)"
        />
      </q-breadcrumbs>

      <drag-and-drop ref="uploader">
        <q-table
          ref="table"
          :rows="rows"
          :columns="columns"
          row-key="name"
          :loading="loading"
          :hide-pagination="true"
          :rows-per-page-options="[0]"
          :flat="true"
          table-class="file-list"
          @row-dblclick="openRowClick"
          @row-click="openRowDlbClick"
        >
          <template v-slot:body-cell-options="prop">
            <td class="text-right">
              <q-btn round flat icon="more_vert" size="sm">
                <q-menu>
                  <FileContextMenu
                    :prop="prop"
                    @openObject="openObject"
                    @deleteObject="$refs.options.deleteObject"
                    @renameObject="$refs.options.renameObject"
                    @updateMetadataObject="$refs.options.updateMetadataObject"
                    @shareObject="shareObject"
                  />
                </q-menu>
              </q-btn>
            </td>
          </template>
        </q-table>

        <div v-if="loadingMore" class="q-pa-md text-center">
          <q-spinner color="primary" size="md" />
          <div class="q-mt-sm text-grey">Loading more files...</div>
        </div>

        <div v-if="!hasMore && rows.length > 0 && !loading" class="q-pa-md text-center text-grey">
          No more files to load
        </div>
      </drag-and-drop>
    </div>

    <file-preview ref="preview"/>
    <file-options ref="options" />
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { useQuasar } from "quasar";
import { useMainStore } from "stores/main-store";
import FileContextMenu from "pages/files/FileContextMenu.vue";
import FileOptions from "components/files/FileOptions.vue";
import FilePreview from "components/preview/FilePreview.vue";
import DragAndDrop from "components/utils/DragAndDrop.vue";
import { ROOT_FOLDER, apiHandler, decode, encode } from "../../appUtils";

export default defineComponent({
  name: "FilesIndexPage",
  components: { FileContextMenu, FileOptions, DragAndDrop, FilePreview },
  data: () => ({
    loading: false,
    loadingMore: false,
    rows: [],
    cursor: null,
    hasMore: true,
    columns: [
      { name: "name", required: true, label: "Name", align: "left", field: "name", sortable: true },
      { name: "lastModified", required: true, label: "Last Modified", align: "left", field: "lastModified", sortable: true },
      { name: "size", required: true, label: "Size", align: "left", field: "size", sortable: true },
      { name: "options", label: "", sortable: false }
    ]
  }),
  computed: {
    selectedBucket() { return this.$route.params.bucket; },
    selectedFolder() {
      if (this.$route.params.folder && this.$route.params.folder !== ROOT_FOLDER) {
        return decode(this.$route.params.folder);
      }
      return "";
    },
    breadcrumbs() {
      if (this.selectedFolder) {
        return [
          { name: this.selectedBucket, path: "/" },
          ...this.selectedFolder.split("/").filter(obj => obj !== "").map((item, index, arr) => ({
            name: item,
            path: `${arr.slice(0, index + 1).join("/").replace("Home/", "")}/`
          }))
        ];
      }
      return [{ name: this.selectedBucket, path: "/" }];
    }
  },
  methods: {
    openObject(row) {
      if (row.type === "folder") {
        this.$router.push({ name: "files-folder", params: { bucket: this.selectedBucket, folder: encode(row.key) } });
      } else {
        this.$refs.preview.openFile(row);
      }
    },
    shareObject: async function (row) {
      try {
        const baseUrl = "https://file.fosbat.art";
        let path = row.key;
        if (this.selectedFolder && this.selectedFolder !== ROOT_FOLDER) {
          path = `${this.selectedFolder}${row.key}`;
        }
        const url = `${baseUrl}/${path}`;

        await navigator.clipboard.writeText(url);
        this.q.notify({ message: "Public R2 link copied to clipboard!", type: "positive", timeout: 5000 });
      } catch (err) {
        this.q.notify({ message: `Failed to copy: ${err}`, type: "negative", timeout: 5000 });
      }
    },
    resetAndFetchFiles: async function () {
      this.rows = [];
      this.cursor = null;
      this.hasMore = true;
      await this.fetchFiles();
    },
    fetchFiles: async function () {
      if (this.loading || this.loadingMore || !this.hasMore) return;
      this.loading = true;
      const result = await apiHandler.fetchFilePage(this.selectedBucket, this.selectedFolder, "/", this.cursor);
      this.rows = result.files;
      this.cursor = result.cursor;
      this.hasMore = result.truncated;
      this.loading = false;
    },
    handleScroll: function () {
      const container = this.$refs.pageContainer;
      if (!container || this.loadingMore || !this.hasMore) return;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      if (scrollTop + clientHeight >= scrollHeight - 200) this.loadMoreFiles();
    },
    loadMoreFiles: async function () {
      if (this.loadingMore || !this.hasMore || this.loading) return;
      this.loadingMore = true;
      const result = await apiHandler.fetchFilePage(this.selectedBucket, this.selectedFolder, "/", this.cursor);
      this.rows = [...this.rows, ...result.files];
      this.cursor = result.cursor;
      this.hasMore = result.truncated;
      this.loadingMore = false;
    }
  },
  mounted() {
    this.resetAndFetchFiles();
    this.$refs.table.sort("name");
    this.$bus.on("fetchFiles", this.resetAndFetchFiles);
  },
  beforeUnmount() {
    this.$bus.off("fetchFiles");
  },
  setup() {
    return { mainStore: useMainStore(), q: useQuasar() };
  }
});
</script>

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./CXData.css";
import { CardSkeleton, TableSkeleton, ChartSkeleton, FormSkeleton } from "../components/common/Skeleton";
import {
  fetchAllCXData,
  createCXData,
  updateCXData,
  deleteCXData,
  bulkDeleteCXData,
  createMultipleCXData,
  clearCXDataMessages,
} from "../redux/slices/cxDataSlice";
import { fetchAllCXServiceCategories } from "../redux/slices/adminSlices/cxServiceCategorySlice";
import { fetchAllRoleStatuses } from "../redux/slices/adminSlices/roleStatusSlice";
import { fetchAllCXModels } from "../redux/slices/adminSlices/cxModelSlice";
import {
  clearCities,
  fetchAllStates,
  fetchCitiesByState,
} from "../redux/slices/adminSlices/stateCitiesSlice";
import { fetchAllStatuses } from "../redux/slices/adminSlices/statusSlice";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";

const initialForm = {
  callReceiveDate: "",
  customerName: "",
  contactNo: "",
  address: "",
  pincode: "",
  state: "",
  city: "",
  model: "",
  serviceCategory: "",
  assignedStatus: "",
};

export default function CXData() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { totalPages = 1, page = 1 } = useSelector((state) => state.cxData);
  const cxDataState = useSelector((state) => state.cxData);
  const cxModelsState = useSelector((state) => state.cxModels);
  const cxServiceCategoriesState = useSelector(
    (state) => state.cxServiceCategories,
  );
  const roleStatusesState = useSelector((state) => state.roleStatuses);
  const { states = [], cities = [] } = useSelector(
    (state) => state.stateCities,
  );

  const { list: statuses = [] } = useSelector((state) => state.statuses || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const [filters, setFilters] = useState({
    state: "",
    city: "",
    status: "",
    assignedStatus: "",
    serviceCategory: "",
    dateFrom: "",
    dateTo: "",
    customerName: "",
  });

  const [columnFilters, setColumnFilters] = useState({
    state: "",
    city: "",
    model: "",
    serviceCategory: "",
    assignedStatus: "",
    status: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  const cxDataList = cxDataState?.list || [];
  const loading = cxDataState?.loading || false;
  const error = cxDataState?.error || null;
  const successMessage = cxDataState?.successMessage || null;

  const cxModels = cxModelsState?.list || [];
  const cxServiceCategories = cxServiceCategoriesState?.list || [];
  const roleStatuses = roleStatusesState?.list || [];

  const [showSidebar, setShowSidebar] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showColumns, setShowColumns] = useState(false);
  const [showTimeline, setShowTimeline] = useState(null);

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");

  const [pageSize, setPageSize] = useState(10);

  const [selectedRows, setSelectedRows] = useState(new Set());

  const [visibleColumns, setVisibleColumns] = useState({
    email: true,
    name: true,
    phone: true,
    state: true,
    status: true,
  });

  useEffect(() => {
    dispatch(fetchAllCXData());
    dispatch(fetchAllCXModels());
    dispatch(fetchAllCXServiceCategories());
    dispatch(fetchAllRoleStatuses());
    dispatch(fetchAllStates());
    dispatch(fetchAllStatuses());

    return () => dispatch(clearCXDataMessages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchAllCXData({
        search: debouncedSearch,
        state: filters.state || columnFilters.state,
        city: filters.city || columnFilters.city,
        model: columnFilters.model,
        serviceCategory:
          filters.serviceCategory || columnFilters.serviceCategory,
        assignedStatus: filters.assignedStatus || columnFilters.assignedStatus,
        status: filters.status || columnFilters.status,
        sort: sortConfig.key,
        order: sortConfig.direction,
        page: currentPage,
        limit: pageSize,
      }),
    );
  }, [
    debouncedSearch,
    filters,
    columnFilters,
    sortConfig,
    currentPage,
    pageSize,
  ]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const handleColumnFilter = (name, value) => {
    setColumnFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, columnFilters, debouncedSearch]);

  useEffect(() => {
    if (form.state) {
      dispatch(fetchCitiesByState(form.state));
    } else {
      dispatch(clearCities());
    }
  }, [form.state, dispatch]);

  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearCXDataMessages());
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("error-toast")) {
      toast.error(error, { toastId: "error-toast" });
      dispatch(clearCXDataMessages());
    }

    if (successMessage && !toast.isActive("success-toast")) {
      toast.success(successMessage, { toastId: "success-toast" });
      dispatch(clearCXDataMessages());
    }
  }, [error, successMessage]);

  const formattedRows = useMemo(() => {
    let data = [...cxDataList];

    if (filters.customerName) {
      data = data.filter((item) =>
        item.customerName
          ?.toLowerCase()
          .includes(filters.customerName.toLowerCase()),
      );
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      data = data.filter((item) => {
        const itemDate = new Date(item.callReceiveDate);
        return itemDate >= from;
      });
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      data = data.filter((item) => {
        const itemDate = new Date(item.callReceiveDate);
        return itemDate <= to;
      });
    }

    return data;
  }, [cxDataList, filters]);

  const isAdmin = useCallback(() => {
    return user?.role?.toLowerCase() === "admin";
  }, [user?.role]);

  const canEditCX = useCallback(
    (cxAssignedStatusId) => {
      // Admins can edit any customer record
      if (isAdmin()) return true;

      if (!cxAssignedStatusId) return false;
      if (!roleStatuses?.length) return false;
      if (!user?.userRole?.length) return false;

      const userRoleIds = new Set(user.userRole.map((r) => r._id));

      const currentStatus = roleStatuses.find(
        (status) => status?._id === cxAssignedStatusId,
      );

      if (!currentStatus) return false;

      const isSameRole = userRoleIds.has(currentStatus?.userRole?._id);

      const isNextRole = currentStatus?.nextRoles?.some((role) =>
        userRoleIds.has(role?._id || role),
      );

      return isSameRole || isNextRole;
    },
    [roleStatuses, user?.userRole, isAdmin],
  );

  const openCreateSidebar = () => {
    setEditId(null);
    setForm(initialForm);
    setShowSidebar(true);
  };

  const openEditSidebar = async (item) => {
    setEditId(item._id);

    const nextForm = {
      customerEmail: item.customerEmail || "",
      callReceiveDate: item.callReceiveDate
        ? new Date(item.callReceiveDate).toISOString().slice(0, 16)
        : "",
      customerName: item.customerName || "",
      contactNo: item.contactNo || "",
      address: item.address || "",
      pincode: item.pincode || "",
      state: item.state || "",
      city: item.city || "",
      model: item.model?._id || "",
      serviceCategory: item.serviceCategory?._id || "",
      assignedStatus: item.assignedStatus?._id || "",
      status: item.status?._id || "",
    };

    setForm(nextForm);
    setShowSidebar(true);

    if (item.state) {
      await loadCities(item.state);
    }
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setEditId(null);
    setForm(initialForm);
  };

  const closeBulkUpload = () => {
    setShowBulkUpload(false);
    setBulkUploadData([]);
    setBulkUploadErrors([]);
    setBulkUploadProgress(0);
    setUploadFileName("");

    // Reset file input element so user can select same file again
    const fileInput = document.getElementById("bulk-upload-file");
    if (fileInput) fileInput.value = "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
      setForm((prev) => ({
        ...prev,
        state: value,
        city: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const payload = {
      customerEmail: form.customerEmail?.trim() || "",
      callReceiveDate: form.callReceiveDate,
      customerName: form.customerName.trim(),
      contactNo: form.contactNo.trim(),
      address: form.address.trim(),
      pincode: form.pincode.trim(),
      state: form.state,
      city: form.city,
      model: form.model || null,
      serviceCategory: form.serviceCategory || null,
      assignedStatus: form.assignedStatus || null,
      status: form.status || null,
    };

    if (
      !payload.callReceiveDate ||
      !payload.customerName ||
      !payload.contactNo
    ) {
      return;
    }

    if (editId) {
      const result = await dispatch(
        updateCXData({
          id: editId,
          ...payload,
        }),
      );

      if (!result.error) {
        closeSidebar();
      }

      return;
    }

    const result = await dispatch(createCXData(payload));

    if (!result.error) {
      closeSidebar();
      toast.success("Customer created successfully");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer data?")) return;
    dispatch(deleteCXData(id));
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      alert("Please select at least one row to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRows.size} customer(s)? This action cannot be undone.`,
    );
    if (!confirmed) return;

    const idsArray = Array.from(selectedRows);
    const result = await dispatch(bulkDeleteCXData(idsArray));

    if (!result.error) {
      setSelectedRows(new Set());
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleRowCheckboxChange = (rowId) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAllChange = () => {
    if (selectedRows.size === formattedRows.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(formattedRows.map((item) => item._id));
      setSelectedRows(allIds);
    }
  };

  const handleExport = () => {
    let dataToExport = [];
    let fileName = "cx-data.xlsx";

    if (selectedRows.size > 0) {
      // Export selected rows
      dataToExport = cxDataList.filter((item) => selectedRows.has(item._id));
      fileName = `cx-data-selected-${selectedRows.size}.xlsx`;
    } else if (
      filters.state ||
      filters.city ||
      filters.status ||
      filters.assignedStatus ||
      filters.serviceCategory ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.customerName
    ) {
      // Export filtered rows
      dataToExport = formattedRows;
      fileName = `cx-data-filtered-${formattedRows.length}.xlsx`;
    } else {
      // Export all rows
      dataToExport = cxDataList;
      fileName = `cx-data-all-${cxDataList.length}.xlsx`;
    }

    const data = dataToExport.map((i) => ({
      Name: i.customerName,
      Email: i.customerEmail,
      Phone: i.contactNo,
      State: i.state,
      City: i.city,
      Model: i.model?.name || "",
      ServiceCategory: i.serviceCategory?.name || "",
      AssignedStatus: i.assignedStatus?.name || "",
      Status: i.status?.name || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CX Data");
    XLSX.writeFile(wb, fileName);
  };

  const getExportLabel = () => {
    if (selectedRows.size > 0) {
      return `⬇ Export Selected (${selectedRows.size})`;
    }

    const hasFilters =
      filters.state ||
      filters.city ||
      filters.status ||
      filters.assignedStatus ||
      filters.serviceCategory ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.customerName;

    if (hasFilters) {
      return `⬇ Export Filtered (${formattedRows.length})`;
    }

    return `⬇ Export All (${cxDataList.length})`;
  };

  const handleBulkUpload = async () => {
    if (bulkUploadData.length === 0) {
      toast.info("No data to upload. Please select a file first.");
      return;
    }

    if (bulkUploadErrors.length > 0) {
      toast.error("Please fix the validation errors before uploading.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to upload ${bulkUploadData.length} customer records?`,
    );
    if (!confirmed) return;

    setBulkUploadProgress(0);
    const result = await dispatch(
      createMultipleCXData({ customers: bulkUploadData }),
    );

    if (result.error) {
      const err = result.payload;

      if (err?.errors) {
        toast.error(
          `${err.failedCount} records failed, ${err.successCount} succeeded`,
        );

        err.errors.slice(0, 3).forEach((e) => {
          toast.warning(`Row ${e.row}: ${e.message}`);
        });
      } else {
        toast.error(err.message || "Bulk upload failed");
      }
    }
    if (!result.error) {
      closeBulkUpload();
    }
  };

  const handleFileUpload = (event) => {
    // Reset all upload state when new file is selected
    setBulkUploadData([]);
    setBulkUploadErrors([]);
    setUploadFileName("");

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setUploadFileName(file.name);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform data
        const validatedData = [];
        const errors = [];

        const valueFor = (row, keys) => {
          const found = keys
            .map((key) => row[key])
            .find((v) => v !== undefined && v !== null && `${v}`.trim() !== "");
          return found !== undefined && found !== null ? `${found}`.trim() : "";
        };

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because Excel starts at 1 and we have headers
          const customer = {};

          // Required fields mapped for both old and user-visible headers
          const name = valueFor(row, ["Name", "Customer Name", "CustomerName"]);
          if (!name) {
            errors.push(`Row ${rowNumber}: Customer Name is required`);
          } else {
            customer.customerName = name;
          }

          const phone = valueFor(row, ["Phone", "Contact No", "ContactNo"]);
          if (!phone) {
            errors.push(`Row ${rowNumber}: Phone is required`);
          } else {
            customer.contactNo = phone;
          }

          // Optional fields
          customer.customerEmail = valueFor(row, [
            "Email",
            "Customer Email",
            "CustomerEmail",
          ]);
          customer.address = valueFor(row, ["Address"]);
          customer.pincode = valueFor(row, ["Pincode", "Pin code", "PinCode"]);
          customer.state = valueFor(row, ["State"]);
          customer.city = valueFor(row, ["City"]);

          // Model lookup
          const modelName = valueFor(row, ["Model", "Model Name"]);
          if (modelName) {
            const model = cxModels.find(
              (m) => m.name.toLowerCase() === modelName.toLowerCase(),
            );
            if (model) {
              customer.model = model._id;
            } else {
              errors.push(`Row ${rowNumber}: Model "${modelName}" not found`);
            }
          }

          // Service Category lookup
          const serviceCategoryName = valueFor(row, [
            "ServiceCategory",
            "Service Category",
          ]);
          if (serviceCategoryName) {
            const serviceCategory = cxServiceCategories.find(
              (sc) =>
                sc.name.toLowerCase() === serviceCategoryName.toLowerCase(),
            );
            if (serviceCategory) {
              customer.serviceCategory = serviceCategory._id;
            } else {
              errors.push(
                `Row ${rowNumber}: Service Category "${serviceCategoryName}" not found`,
              );
            }
          }

          // Assigned Status lookup
          const assignedStatusName = valueFor(row, [
            "AssignedStatus",
            "Assigned Status",
          ]);
          if (assignedStatusName) {
            const assignedStatus = roleStatuses.find(
              (rs) =>
                rs.name.toLowerCase() === assignedStatusName.toLowerCase(),
            );
            if (assignedStatus) {
              customer.assignedStatus = assignedStatus._id;
            } else {
              errors.push(
                `Row ${rowNumber}: Assigned Status "${assignedStatusName}" not found`,
              );
            }
          }

          // Status lookup
          const statusName = valueFor(row, ["Status"]);
          if (statusName) {
            const status = statuses.find(
              (s) => s.name.toLowerCase() === statusName.toLowerCase(),
            );
            if (status) {
              customer.status = status._id;
            } else {
              errors.push(`Row ${rowNumber}: Status "${statusName}" not found`);
            }
          }

          // Call Receive Date
          const callReceiveDateValue = valueFor(row, [
            "CallReceiveDate",
            "Call Receive Date",
            "Call_Receive_Date",
          ]);
          if (callReceiveDateValue) {
            const date = new Date(callReceiveDateValue);
            if (!isNaN(date.getTime())) {
              customer.callReceiveDate = date.toISOString();
            } else {
              errors.push(`Row ${rowNumber}: Invalid Call Receive Date format`);
            }
          } else {
            customer.callReceiveDate = new Date().toISOString();
          }

          if (
            Object.keys(customer).length > 0 &&
            !errors.some((error) => error.startsWith(`Row ${rowNumber}:`))
          ) {
            validatedData.push(customer);
          }
        });

        setBulkUploadData(validatedData);
        setBulkUploadErrors(errors);
      } catch (error) {
        alert(
          "Error reading file. Please make sure it's a valid Excel or CSV file.",
        );
        console.error("File parsing error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const stateValues = Array.from(
      new Set(states.map((s) => s.name).filter(Boolean)),
    );
    const cityValues = Array.from(
      new Set(cities.map((c) => c.name).filter(Boolean)),
    );
    const modelValues = Array.from(
      new Set(cxModels.map((m) => m.name).filter(Boolean)),
    );
    const serviceCategoryValues = Array.from(
      new Set(cxServiceCategories.map((c) => c.name).filter(Boolean)),
    );
    const assignedStatusValues = Array.from(
      new Set(roleStatuses.map((r) => r.name).filter(Boolean)),
    );
    const statusValues = Array.from(
      new Set(statuses.map((s) => s.name).filter(Boolean)),
    );

    // Build city list per state for dependent dropdown
    const stateCityMap = {};
    cities.forEach((c) => {
      const stateName = c.state?.trim();
      const cityName = c.name?.trim();
      if (!stateName || !cityName) return;
      if (!stateCityMap[stateName]) stateCityMap[stateName] = new Set();
      stateCityMap[stateName].add(cityName);
    });

    const normalizeNameForRange = (name) =>
      name
        .replace(/[^A-Za-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

    const getColumnLetter = (colIndex) => {
      let letter = "";
      while (colIndex > 0) {
        const modulo = (colIndex - 1) % 26;
        letter = String.fromCharCode(65 + modulo) + letter;
        colIndex = Math.floor((colIndex - modulo) / 26);
      }
      return letter;
    };

    const headers = [
      "Call Receive Date",
      "Customer Name",
      "Customer Email",
      "Contact No",
      "Address",
      "Pincode",
      "State",
      "City",
      "Model",
      "Service Category",
      "Assigned Status",
      "Status",
    ];

    const templateData = [
      headers.reduce((acc, header) => ({ ...acc, [header]: "" }), {}),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });

    ws["!autofilter"] = { ref: `A1:L1` };

    ws["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
    ];

    if (!ws["!dataValidations"]) ws["!dataValidations"] = [];

    const addValidation = (sqref, sheetName, valueLength, title) => {
      if (valueLength === 0) return;
      ws["!dataValidations"].push({
        sqref,
        allowBlank: true,
        showInputMessage: true,
        promptTitle: `Select ${title}`,
        prompt: `Choose from the list of available ${title.toLowerCase()}`,
        showErrorMessage: true,
        errorTitle: `Invalid ${title}`,
        error: `Please select a valid ${title.toLowerCase()} from the dropdown`,
        type: "list",
        formula1: `${sheetName}!$A$2:$A$${valueLength + 1}`,
      });
    };

    addValidation("F2:F1000", "States", stateValues.length, "State");

    // City validation depends on state selection in the same row.
    ws["!dataValidations"].push({
      sqref: "G2:G1000",
      allowBlank: true,
      showInputMessage: true,
      promptTitle: "Select City",
      prompt: "Choose corresponding city based on selected state",
      showErrorMessage: true,
      errorTitle: "Invalid City",
      error: "Please select a valid city for the selected state",
      type: "list",
      formula1: '=INDIRECT("Cities_" & SUBSTITUTE($F2," ","_"))',
    });

    addValidation("H2:H1000", "Models", modelValues.length, "Model");
    addValidation(
      "I2:I1000",
      "ServiceCategories",
      serviceCategoryValues.length,
      "Service Category",
    );
    addValidation(
      "J2:J1000",
      "AssignedStatuses",
      assignedStatusValues.length,
      "Assigned Status",
    );
    addValidation("K2:K1000", "Statuses", statusValues.length, "Status");

    XLSX.utils.book_append_sheet(wb, ws, "Template");

    if (stateValues.length > 0) {
      const stateSheet = XLSX.utils.aoa_to_sheet([
        ["State"],
        ...stateValues.map((v) => [v]),
      ]);
      XLSX.utils.book_append_sheet(wb, stateSheet, "States");
    }
    if (cityValues.length > 0) {
      const citySheet = XLSX.utils.aoa_to_sheet([
        ["City"],
        ...cityValues.map((v) => [v]),
      ]);
      XLSX.utils.book_append_sheet(wb, citySheet, "Cities");
    }

    // Create a state -> cities sheet for dependent city dropdowns.
    const stateKeys = Object.keys(stateCityMap);
    const maxCities = Math.max(
      0,
      ...stateKeys.map((s) => stateCityMap[s].size),
    );
    const stateCitiesRows = [stateKeys];

    for (let row = 0; row < maxCities; row += 1) {
      const rowValues = stateKeys.map((stateName) => {
        const citiesList = Array.from(stateCityMap[stateName]);
        return citiesList[row] || "";
      });
      stateCitiesRows.push(rowValues);
    }

    if (stateKeys.length > 0) {
      const stateCitiesSheet = XLSX.utils.aoa_to_sheet(stateCitiesRows);
      XLSX.utils.book_append_sheet(wb, stateCitiesSheet, "StateCities");

      if (!wb.Workbook) wb.Workbook = {};
      if (!wb.Workbook.Names) wb.Workbook.Names = [];

      stateKeys.forEach((stateName, idx) => {
        const normalized = normalizeNameForRange(stateName);
        if (!normalized) return;

        const cityCount = stateCityMap[stateName].size;
        if (cityCount === 0) return;

        const colLetter = getColumnLetter(idx + 1);
        const range = `'StateCities'!$${colLetter}$2:$${colLetter}$${cityCount + 1}`;
        wb.Workbook.Names.push({ Name: `Cities_${normalized}`, Ref: range });
      });
    }

    if (modelValues.length > 0) {
      const modelSheet = XLSX.utils.aoa_to_sheet([
        ["Model"],
        ...modelValues.map((v) => [v]),
      ]);
      XLSX.utils.book_append_sheet(wb, modelSheet, "Models");
    }
    if (serviceCategoryValues.length > 0) {
      const serviceSheet = XLSX.utils.aoa_to_sheet([
        ["ServiceCategory"],
        ...serviceCategoryValues.map((v) => [v]),
      ]);
      XLSX.utils.book_append_sheet(wb, serviceSheet, "ServiceCategories");
    }
    if (assignedStatusValues.length > 0) {
      const assignedSheet = XLSX.utils.aoa_to_sheet([
        ["AssignedStatus"],
        ...assignedStatusValues.map((v) => [v]),
      ]);
      XLSX.utils.book_append_sheet(wb, assignedSheet, "AssignedStatuses");
    }
    if (statusValues.length > 0) {
      const statusSheet = XLSX.utils.aoa_to_sheet([
        ["Status"],
        ...statusValues.map((v) => [v]),
      ]);
      statusSheet["!cols"] = [{ wch: 25 }];
      XLSX.utils.book_append_sheet(wb, statusSheet, "Status");
    }

    // Add a short instruction sheet for users
    const instructionRows = [
      ["Instructions", "Value"],
      ["Use this template for bulk upload of CX data", ""],
      ["Do not change the header row", ""],
      ["Make sure all required fields are filled: Customer Name, Phone", ""],
      [
        "Use dropdown values for State/City/Model/Service Category/Assigned Status/Status",
        "",
      ],
      [
        "If dropdown is empty, add values in the app first and redownload template",
        "",
      ],
      [],
      ["Field", "Available values"],
      ["State", stateValues.join(", ")],
      [
        "City",
        "Depends on State selection; choose from city dropdown after selecting state",
      ],
      ["Model", modelValues.join(", ")],
      ["Service Category", serviceCategoryValues.join(", ")],
      ["Assigned Status", assignedStatusValues.join(", ")],
      ["Status", statusValues.join(", ")],
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructionRows);
    XLSX.utils.book_append_sheet(wb, instructionSheet, "Instructions");

    XLSX.writeFile(wb, "cx-data-template.xlsx");
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2>CX Data</h2>
          <p className="subtitle">Manage and track all customer interactions</p>
        </div>

        <div className="actions-top">
          <div className="search-wrap">
            <input
              type="text"
              placeholder="Search by name, email, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <button
            className="btn-outline"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </button>

          <button
            className="btn-secondary"
            onClick={handleExport}
            disabled={cxDataList.length === 0}
          >
            {getExportLabel()}
          </button>

          <button
            className="btn-primary"
            onClick={openCreateSidebar}
            disabled={!isAdmin()}
          >
            + Add Customer
          </button>

          <button
            className="btn-outline"
            onClick={() => setShowBulkUpload(true)}
            disabled={!isAdmin()}
          >
            📤 Bulk Upload Customers
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-item">
              <label>Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>

            <div className="filter-item">
              <label>Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>

            <div className="filter-item">
              <label>Customer Name</label>
              <input
                type="text"
                placeholder="Search name..."
                value={filters.customerName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    customerName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="filter-item">
              <label>State</label>
              <select
                value={filters.state}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    state: e.target.value,
                    city: "",
                  }))
                }
              >
                <option value="">All states</option>
                {states.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>City</label>
              <select
                value={filters.city}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, city: e.target.value }))
                }
                disabled={!filters.state}
              >
                <option value="">All cities</option>
                {cities.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-item">
              <label>Service Category</label>
              <select
                value={filters.serviceCategory}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    serviceCategory: e.target.value,
                  }))
                }
              >
                <option value="">All categories</option>
                {cxServiceCategories.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Assigned Status</label>
              <select
                value={filters.assignedStatus}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    assignedStatus: e.target.value,
                  }))
                }
              >
                <option value="">All assigned statuses</option>
                {roleStatuses.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="">All statuses</option>
                {statuses.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-actions">
              <div className="filter-actions-child">
                <button
                  onClick={() => {
                    setShowFilters(false);
                    setCurrentPage(1);
                  }}
                  className="btn-outline"
                >
                  Apply filters
                </button>
                <button
                  className="btn-delete"
                  onClick={() =>
                    setFilters({
                      state: "",
                      city: "",
                      status: "",
                      assignedStatus: "",
                      serviceCategory: "",
                      dateFrom: "",
                      dateTo: "",
                      customerName: "",
                    })
                  }
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton-global-container">
          <CardSkeleton count={1} />
          <TableSkeleton rows={8} cols={10} />
        </div>
      ) : (
        <div className="table-wrap">
          <div className="bulk-actions">
            <label>
              <input
                type="checkbox"
                checked={
                  selectedRows.size > 0 &&
                  selectedRows.size === formattedRows.length
                }
                onChange={handleSelectAllChange}
              />
              Select all
            </label>
            <button
              className="btn-delete"
              onClick={handleBulkDelete}
              title={`Delete ${selectedRows.size} selected row(s)`}
              disabled={selectedRows.size === 0}
            >
              🗑 Delete ({selectedRows.size})
            </button>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  
                </th>
                <th onClick={() => handleSort("customerEmail")}>
                  Customer Email {getSortIcon("customerName")}
                </th>
                <th onClick={() => handleSort("callReceiveDate")}>
                  Call Receive Date {getSortIcon("callReceiveDate")}
                </th>
                <th onClick={() => handleSort("customerName")}>
                  Customer Name {getSortIcon("customerName")}
                </th>
                <th onClick={() => handleSort("contactNo")}>
                  Contact No {getSortIcon("contactNo")}
                </th>
                <th onClick={() => handleSort("address")}>
                  Address {getSortIcon("address")}
                </th>
                <th onClick={() => handleSort("pincode")}>
                  Pincode {getSortIcon("pincode")}
                </th>
                <th onClick={() => handleSort("state")}>
                  State {getSortIcon("state")}
                </th>
                <th onClick={() => handleSort("city")}>
                  City {getSortIcon("city")}
                </th>
                <th onClick={() => handleSort("model")}>
                  Models {getSortIcon("model")}
                </th>
                <th onClick={() => handleSort("serviceCategory")}>
                  Service Category {getSortIcon("serviceCategory")}
                </th>
                <th onClick={() => handleSort("assignedStatus")}>
                  Assigned Status {getSortIcon("assignedStatus")}
                </th>
                <th onClick={() => handleSort("status")}>
                  Status {getSortIcon("status")}
                </th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {formattedRows.map((item) => (
                <tr
                  key={item._id}
                  className={selectedRows.has(item._id) ? "selected-row" : ""}
                >
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item._id)}
                      onChange={() => handleRowCheckboxChange(item._id)}
                      className="table-checkbox"
                    />
                  </td>
                  <td>{item.customerEmail || "-"}</td>
                  <td>
                    {item.callReceiveDate
                      ? new Date(item.callReceiveDate).toLocaleString()
                      : "-"}
                  </td>
                  <td>{item.customerName || "-"}</td>
                  <td>{item.contactNo || "-"}</td>
                  <td>{item.address || "-"}</td>
                  <td>{item.pincode || "-"}</td>
                  <td>{item.state || "-"}</td>
                  <td>{item.city || "-"}</td>
                  <td>{item.model?.name || "-"}</td>
                  <td>{item.serviceCategory?.name || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        item.assignedStatus?.name?.toLowerCase() || "unknown"
                      }`}
                    >
                      {item.assignedStatus?.name || "-"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${item.status?.name?.toLowerCase() || "unknown"}`}
                    >
                      {item.status?.name || "-"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-btns">
                      <button
                        className="btn-role"
                        onClick={() => openEditSidebar(item)}
                        disabled={!canEditCX(item.assignedStatus?._id)}
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item._id)}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {formattedRows.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No customer data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="pagination-wrapper">
            <div className="pagination-info">
              <span>Total Customers: {formattedRows.length}</span>
            </div>

            <div className="pagination-controls">
              <button
                className="pagination-btn pagination-arrow"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ◀
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((num) => {
                  const distance = Math.abs(num - page);
                  return distance <= 2 || num === 1 || num === totalPages;
                })
                .map((num, idx, arr) => (
                  <div key={num}>
                    {idx > 0 && arr[idx - 1] !== num - 1 && (
                      <span className="pagination-dots">...</span>
                    )}
                    <button
                      className={`pagination-btn ${page === num ? "active" : ""}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  </div>
                ))}

              <button
                className="pagination-btn pagination-arrow"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={page >= totalPages}
              >
                ▶
              </button>
            </div>

            <div className="pagination-page-size">
              <label>Show per Page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {showSidebar && (
        <>
          <div className="right-sidebar-backdrop" onClick={closeSidebar} />

          <div className="right-sidebar-modal">
            <div className="right-sidebar-header">
              <h3>{editId ? "Edit CX Data" : "Add CX Data"}</h3>
              <button className="sidebar-close-btn" onClick={closeSidebar}>
                ✕
              </button>
            </div>

            <div className="right-sidebar-body">
              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={form.customerEmail || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Call Receive Date</label>
                <input
                  type="datetime-local"
                  name="callReceiveDate"
                  value={form.callReceiveDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="form-group">
                <label>Contact No</label>
                <input
                  type="text"
                  name="contactNo"
                  value={form.contactNo}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  disabled={statesLoading}
                >
                  <option value="">
                    {statesLoading ? "Loading states..." : "Select state"}
                  </option>
                  {states?.map((stateName) => (
                    <option key={stateName?.name} value={stateName?.name}>
                      {stateName?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>City</label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  disabled={!form.state || citiesLoading}
                >
                  <option value="">
                    {citiesLoading ? "Loading cities..." : "Select city"}
                  </option>
                  {cities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Model</label>
                <select name="model" value={form.model} onChange={handleChange}>
                  <option value="">Select model</option>
                  {cxModels.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Service Category</label>
                <select
                  name="serviceCategory"
                  value={form.serviceCategory}
                  onChange={handleChange}
                >
                  <option value="">Select service category</option>
                  {cxServiceCategories.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Status</label>
                <select
                  name="assignedStatus"
                  value={form.assignedStatus}
                  onChange={handleChange}
                >
                  <option value="">Select assigned status</option>
                  {roleStatuses.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="">Select status</option>
                  {statuses.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="right-sidebar-footer">
              <button className="btn-delete" onClick={closeSidebar}>
                Cancel
              </button>
              <button
                className="btn-role"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !form.callReceiveDate ||
                  !form.customerName.trim() ||
                  !form.contactNo.trim()
                }
              >
                {loading ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}

      {showColumns && (
        <div className="cx-data-modal">
          <div className="cx-data-modal-box">
            <h3>Columns</h3>

            {Object.keys(visibleColumns).map((col) => (
              <label key={col}>
                <input
                  type="checkbox"
                  checked={visibleColumns[col]}
                  onChange={() =>
                    setVisibleColumns({
                      ...visibleColumns,
                      [col]: !visibleColumns[col],
                    })
                  }
                />
                {col}
              </label>
            ))}

            <button onClick={() => setShowColumns(false)}>Close</button>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {showTimeline && (
        <div className="cx-data-modal">
          <div className="cx-data-modal-box">
            <h3>Activity Timeline</h3>

            <p>Customer: {showTimeline.customerName}</p>

            <ul>
              <li>Created</li>
              <li>Status Updated</li>
              <li>Assigned</li>
            </ul>

            <button onClick={() => setShowTimeline(null)}>Close</button>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {showBulkUpload && (
        <div
          className="cx-data-modal"
          onClick={(e) => e.target === e.currentTarget && closeBulkUpload()}
        >
          <div className="cx-data-modal-box bulk-upload-modal">
            <div className="modal-header">
              <h3>Bulk Upload Customer Data</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowBulkUpload(false);
                  setBulkUploadData([]);
                  setBulkUploadErrors([]);
                  setBulkUploadProgress(0);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="upload-section">
                <div className="upload-info">
                  <h4>Upload Instructions</h4>
                  <p>
                    Upload an Excel (.xlsx) or CSV file with customer data.
                    Required columns: Name, Phone
                  </p>
                  <button className="btn-outline" onClick={downloadTemplate}>
                    📥 Download Template
                  </button>
                </div>

                <div className="file-upload">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    id="bulk-upload-file"
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="bulk-upload-file"
                    className="file-upload-label"
                  >
                    📁 Choose File
                  </label>
                  {uploadFileName && (
                    <p className="upload-file-name">
                      Selected file: {uploadFileName}
                    </p>
                  )}
                </div>
              </div>

              {bulkUploadData.length > 0 && (
                <div className="upload-preview">
                  <h4>Preview ({bulkUploadData.length} records)</h4>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>State</th>
                          <th>City</th>
                          <th>Model</th>
                          <th>Service Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkUploadData.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            <td>{item.customerName}</td>
                            <td>{item.customerEmail || "-"}</td>
                            <td>{item.contactNo}</td>
                            <td>{item.state || "-"}</td>
                            <td>{item.city || "-"}</td>
                            <td>
                              {cxModels.find((m) => m._id === item.model)
                                ?.name || "-"}
                            </td>
                            <td>
                              {cxServiceCategories.find(
                                (sc) => sc._id === item.serviceCategory,
                              )?.name || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkUploadData.length > 5 && (
                    <p className="preview-note">
                      ... and {bulkUploadData.length - 5} more records
                    </p>
                  )}
                </div>
              )}

              {bulkUploadErrors.length > 0 && (
                <div className="upload-errors">
                  <h4>Validation Errors ({bulkUploadErrors.length})</h4>
                  <div className="error-list">
                    {bulkUploadErrors.slice(0, 10).map((error, index) => (
                      <div key={index} className="error-item">
                        {error}
                      </div>
                    ))}
                  </div>
                  {bulkUploadErrors.length > 10 && (
                    <p className="error-note">
                      ... and {bulkUploadErrors.length - 10} more errors
                    </p>
                  )}
                </div>
              )}

              {bulkUploadProgress > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${bulkUploadProgress}%` }}
                    ></div>
                  </div>
                  <p>Uploading... {bulkUploadProgress}%</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-delete"
                onClick={() => {
                  setShowBulkUpload(false);
                  setBulkUploadData([]);
                  setBulkUploadErrors([]);
                  setBulkUploadProgress(0);
                  setUploadFileName("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn-role"
                onClick={handleBulkUpload}
                disabled={
                  bulkUploadData.length === 0 ||
                  bulkUploadErrors.length > 0 ||
                  loading
                }
              >
                {loading
                  ? "Uploading..."
                  : `Upload ${bulkUploadData.length} Records`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

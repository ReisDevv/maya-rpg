package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class PaginatedResponse<T> {
    // NestJS retorna: { data: [], total: N, page: N, pageSize: N, totalPages: N }
    // ATENÇÃO: Campos anteriores (totalElements, number) eram nomes do Spring Boot — incompatíveis com NestJS
    @SerializedName("data")
    private List<T> data;

    @SerializedName("total")
    private int total;

    @SerializedName("page")
    private int page;

    @SerializedName("pageSize")
    private int pageSize;

    @SerializedName("totalPages")
    private int totalPages;

    public List<T> getData() { return data; }
    public List<T> getContent() { return data; } // Alias de compatibilidade

    public int getTotal() { return total; }
    public int getPage() { return page; }
    public int getPageSize() { return pageSize; }
    public int getTotalPages() { return totalPages; }
}
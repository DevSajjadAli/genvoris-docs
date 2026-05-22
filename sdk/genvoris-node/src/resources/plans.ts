import { HttpClient, ListResult, paginationToQuery } from '../client';
import { CreatePlanInput, PaginationParams, Plan, UpdatePlanInput } from '../types';

export class PlansResource {
  constructor(private readonly http: HttpClient) {}

  list(params?: PaginationParams): Promise<ListResult<Plan>> {
    return this.http.request<ListResult<Plan>>({
      method: 'GET',
      path: '/api/v1/plans',
      query: paginationToQuery(params),
    });
  }

  retrieve(id: string): Promise<Plan> {
    return this.http.request<Plan>({
      method: 'GET',
      path: `/api/v1/plans/${encodeURIComponent(id)}`,
    });
  }

  create(input: CreatePlanInput): Promise<Plan> {
    return this.http.request<Plan>({
      method: 'POST',
      path: '/api/v1/plans',
      body: input,
    });
  }

  update(id: string, input: UpdatePlanInput): Promise<Plan> {
    return this.http.request<Plan>({
      method: 'PATCH',
      path: `/api/v1/plans/${encodeURIComponent(id)}`,
      body: input,
    });
  }

  delete(id: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/api/v1/plans/${encodeURIComponent(id)}`,
    });
  }
}

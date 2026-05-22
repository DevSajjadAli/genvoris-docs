import { HttpClient, ListResult, paginationToQuery } from '../client';
import {
  CreateCustomerInput,
  Customer,
  PaginationParams,
  UpdateCustomerInput,
} from '../types';

export class CustomersResource {
  constructor(private readonly http: HttpClient) {}

  list(params?: PaginationParams): Promise<ListResult<Customer>> {
    return this.http.request<ListResult<Customer>>({
      method: 'GET',
      path: '/api/v1/customers',
      query: paginationToQuery(params),
    });
  }

  retrieve(id: string): Promise<Customer> {
    return this.http.request<Customer>({
      method: 'GET',
      path: `/api/v1/customers/${encodeURIComponent(id)}`,
    });
  }

  create(input: CreateCustomerInput): Promise<Customer> {
    return this.http.request<Customer>({
      method: 'POST',
      path: '/api/v1/customers',
      body: input,
    });
  }

  update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    return this.http.request<Customer>({
      method: 'PATCH',
      path: `/api/v1/customers/${encodeURIComponent(id)}`,
      body: input,
    });
  }

  delete(id: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/api/v1/customers/${encodeURIComponent(id)}`,
    });
  }
}

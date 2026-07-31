import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { CategoryService } from 'src/modules/category/category.service';
import { Category } from 'src/modules/category/entities/category.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';

// Request-scoped: mỗi GraphQL request tạo instance mới
// DataLoader batch các queries trong cùng 1 request để tránh N+1
@Injectable({ scope: Scope.REQUEST })
export class ProductDataLoader {
  // DataLoader cho Category: batch load nhiều category cùng lúc
  readonly categoryLoader: DataLoader<number, Category | null>;

  // DataLoader cho Seller (User): batch load nhiều user cùng lúc
  readonly sellerLoader: DataLoader<number, User | null>;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly userService: UserService,
  ) {
    // Batch function: nhận array IDs, trả về array kết quả theo đúng thứ tự
    this.categoryLoader = new DataLoader<number, Category | null>(
      async (ids) => {
        const categories = await this.categoryService.getCategoriesByIds([
          ...ids,
        ]);
        const map = new Map(categories.map((c) => [c.id, c]));
        return ids.map((id) => map.get(id) ?? null);
      },
    );

    this.sellerLoader = new DataLoader<number, User | null>(async (ids) => {
      const users = await this.userService.getUsersByIds([...ids]);
      const map = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => map.get(id) ?? null);
    });
  }
}

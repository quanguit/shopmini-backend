import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import { ProductService } from '../product.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly productService: ProductService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload; params: { id: string } }>();

    const user = request.user;
    const productId = parseInt(request.params.id, 10);

    const product = await this.productService.findProductById(productId);

    if (product.sellerId !== user.sub) {
      throw new ForbiddenException('You do not own this product');
    }

    return true;
  }
}

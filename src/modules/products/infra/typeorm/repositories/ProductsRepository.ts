import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import AppError from '@shared/errors/AppError';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => product.id);
    const findProducts = await this.ormRepository.find({ id: In(ids) });
    if (findProducts.length !== ids.length)
      throw new AppError('Some products were not found.');
    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsDb = await this.findAllById(products);

    const productsResult = productsDb.map(productDb => {
      const product = products.find(product => product.id === productDb.id);

      if (!product) throw new AppError(`Product ${productDb.id} not found`);

      if (product.quantity > productDb.quantity)
        throw new AppError('Insufficient product quantity');

      return {
        ...productDb,
        quantity: productDb.quantity - product.quantity,
      };
    });

    await this.ormRepository.save(productsResult);

    return productsResult;
  }
}

export default ProductsRepository;

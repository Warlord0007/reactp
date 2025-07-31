const tf = require("@tensorflow/tfjs")
require("@tensorflow/tfjs-backend-cpu")
const sharp = require("sharp")
const natural = require("natural")
const Product = require("../models/Product")
const ProductEmbedding = require("../models/ProductEmbedding")
const path = require("path")
const fs = require("fs")

class CNNRecommendationService {
  constructor() {
    this.imageModel = null
    this.textTokenizer = new natural.WordTokenizer()
    this.stemmer = natural.PorterStemmer
    this.tfidf = new natural.TfIdf()
    this.isInitialized = false
    this.modelType = "none" // 'mobilenet', 'simple', 'none'
    this.initializeTensorFlow()
  }

  async initializeTensorFlow() {
    try {
      await tf.setBackend("cpu")
      await tf.ready()
      console.log("✓ TensorFlow.js initialized with CPU backend")
      console.log("Backend:", tf.getBackend())
      console.log("Version:", tf.version.tfjs)
    } catch (error) {
      console.error("Failed to initialize TensorFlow.js:", error.message)
    }
  }

  async initialize() {
    try {
      console.log("Initializing CNN Recommendation Service...")

      // Try multiple model sources with fallbacks
      const modelSources = [
        {
          url: "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json",
          type: "mobilenet_v1_025",
        },
        {
          url: "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json",
          type: "mobilenet_v1_100",
        },
        {
          url: "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3/default/1",
          type: "mobilenet_v2_tfhub",
          options: { fromTFHub: true },
        },
      ]

      // Try loading pre-trained models
      for (const source of modelSources) {
        try {
          console.log(`Attempting to load ${source.type} from: ${source.url}`)

          this.imageModel = await tf.loadLayersModel(source.url, source.options || {})
          this.modelType = source.type
          console.log(`✓ Successfully loaded ${source.type}`)
          this.isInitialized = true
          return
        } catch (error) {
          console.log(`✗ Failed to load ${source.type}: ${error.message}`)
          continue
        }
      }

      // If all external models fail, create a simple CNN
      console.log("All external models failed, creating simple CNN...")
      await this.createSimpleCNN()
    } catch (error) {
      console.error("Failed to initialize CNN service:", error)
      // Fallback to mock embeddings for development
      this.isInitialized = false
      this.modelType = "mock"
      console.log("⚠ Using mock embeddings for development")
    }
  }

  async createSimpleCNN() {
    try {
      console.log("Creating simple CNN for image feature extraction...")

      // Create a simple CNN that can process 224x224x3 images
      this.imageModel = tf.sequential({
        layers: [
          // Convolutional layers
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 32,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),

          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),

          tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),

          // Global average pooling instead of flatten to reduce parameters
          tf.layers.globalAveragePooling2d(),

          // Dense layers for feature extraction
          tf.layers.dense({ units: 512, activation: "relu" }),
          tf.layers.dropout({ rate: 0.5 }),
          tf.layers.dense({ units: 512, activation: "relu", name: "feature_layer" }),
        ],
      })

      // Compile the model (though we won't train it)
      this.imageModel.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy",
      })

      this.modelType = "simple_cnn"
      this.isInitialized = true
      console.log("✓ Simple CNN created successfully")

      // Print model summary
      this.imageModel.summary()
    } catch (error) {
      console.error("Failed to create simple CNN:", error)
      throw error
    }
  }

  // Enhanced image preprocessing with better error handling
  async preprocessImage(imagePath) {
    try {
      let fullPath = imagePath

      // Handle different path formats
      if (!path.isAbsolute(imagePath)) {
        fullPath = path.join(__dirname, "..", imagePath)
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.warn(`Image not found: ${fullPath}, using placeholder`)
        return this.createPlaceholderImageTensor()
      }

      // Get file stats to check if it's a valid file
      const stats = fs.statSync(fullPath)
      if (!stats.isFile() || stats.size === 0) {
        console.warn(`Invalid image file: ${fullPath}, using placeholder`)
        return this.createPlaceholderImageTensor()
      }

      console.log(`Processing image: ${fullPath} (${stats.size} bytes)`)

      // Resize and normalize image to 224x224x3
      const imageBuffer = await sharp(fullPath)
        .resize(224, 224, {
          fit: "cover",
          position: "center",
        })
        .removeAlpha()
        .raw()
        .toBuffer()

      // Convert to tensor and normalize to [0,1]
      const imageTensor = tf.tensor3d(new Uint8Array(imageBuffer), [224, 224, 3])
      const normalizedImage = imageTensor.div(255.0)

      // Add batch dimension
      const batchedImage = normalizedImage.expandDims(0)

      // Cleanup intermediate tensors
      imageTensor.dispose()
      normalizedImage.dispose()

      return batchedImage
    } catch (error) {
      console.error("Image preprocessing error:", error.message)
      // Return placeholder tensor as fallback
      return this.createPlaceholderImageTensor()
    }
  }

  createPlaceholderImageTensor() {
    // Create a simple gradient pattern as placeholder
    const data = new Float32Array(224 * 224 * 3)
    for (let i = 0; i < 224; i++) {
      for (let j = 0; j < 224; j++) {
        const idx = (i * 224 + j) * 3
        data[idx] = i / 224 // Red gradient
        data[idx + 1] = j / 224 // Green gradient
        data[idx + 2] = 0.5 // Blue constant
      }
    }
    return tf.tensor4d(data, [1, 224, 224, 3])
  }

  // Enhanced image feature extraction with multiple fallbacks
  async extractImageFeatures(imagePath) {
    try {
      // If no model is initialized, return category-based embedding
      if (!this.isInitialized || !this.imageModel) {
        console.warn("Model not initialized, using mock embedding")
        return Array.from({ length: 512 }, () => Math.random() * 2 - 1)
      }

      const preprocessedImage = await this.preprocessImage(imagePath)

      let features
      if (this.modelType.includes("mobilenet")) {
        // For MobileNet models, direct prediction
        features = await this.imageModel.predict(preprocessedImage)
      } else {
        // For simple CNN, get features from the feature layer
        const featureLayer = this.imageModel.getLayer("feature_layer")
        const featureModel = tf.model({
          inputs: this.imageModel.input,
          outputs: featureLayer.output,
        })
        features = await featureModel.predict(preprocessedImage)
        featureModel.dispose()
      }

      const featureArray = await features.data()

      // Cleanup tensors
      preprocessedImage.dispose()
      features.dispose()

      // Ensure we return exactly 512 features
      const result = Array.from(featureArray)
      if (result.length > 512) {
        return result.slice(0, 512)
      } else if (result.length < 512) {
        // Pad with zeros if needed
        while (result.length < 512) {
          result.push(0)
        }
      }

      return result
    } catch (error) {
      console.error("Image feature extraction error:", error.message)
      // Return mock embedding with some structure based on error type
      if (error.message.includes("shape")) {
        console.warn("Shape mismatch error, returning structured mock embedding")
        return Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.1) * 0.5)
      }
      return Array.from({ length: 512 }, () => Math.random() * 2 - 1)
    }
  }

  // Enhanced text feature extraction
  extractTextFeatures(productName, description) {
    try {
      // Combine name and description with proper handling of undefined values
      const name = productName || ""
      const desc = description || ""
      const combinedText = `${name} ${desc}`.toLowerCase().trim()

      if (!combinedText) {
        console.warn("Empty text input, returning zero vector")
        return Array.from({ length: 256 }, () => 0)
      }

      // Tokenize and stem
      const tokens = this.textTokenizer.tokenize(combinedText) || []
      const stemmedTokens = tokens.map((token) => this.stemmer.stem(token))

      if (stemmedTokens.length === 0) {
        console.warn("No valid tokens found, returning random vector")
        return Array.from({ length: 256 }, () => Math.random() * 0.1)
      }

      // Create TF-IDF vector
      this.tfidf.addDocument(stemmedTokens)
      const tfidfVector = []

      // Get top 256 features (or pad with zeros)
      const terms = this.tfidf.listTerms(this.tfidf.documents.length - 1)

      for (let i = 0; i < 256; i++) {
        if (i < terms.length) {
          tfidfVector.push(terms[i].tfidf)
        } else {
          tfidfVector.push(0)
        }
      }

      // Normalize the vector
      const magnitude = Math.sqrt(tfidfVector.reduce((sum, val) => sum + val * val, 0))
      const normalizedVector = magnitude > 0 ? tfidfVector.map((val) => val / magnitude) : tfidfVector

      return normalizedVector
    } catch (error) {
      console.error("Text feature extraction error:", error.message)
      // Return structured mock embedding based on text length
      const textLength = (productName || "").length + (description || "").length
      return Array.from({ length: 256 }, (_, i) => Math.sin(i * textLength * 0.01) * 0.3)
    }
  }

  // Rest of your methods remain the same...
  combineEmbeddings(imageEmbedding, textEmbedding, imageWeight = 0.7, textWeight = 0.3) {
    try {
      // Ensure embeddings have the expected lengths
      const imgEmb =
        imageEmbedding.length === 512
          ? imageEmbedding
          : imageEmbedding.slice(0, 512).concat(Array(Math.max(0, 512 - imageEmbedding.length)).fill(0))
      const txtEmb =
        textEmbedding.length === 256
          ? textEmbedding
          : textEmbedding.slice(0, 256).concat(Array(Math.max(0, 256 - textEmbedding.length)).fill(0))

      // Weighted combination
      const weightedImageEmbedding = imgEmb.map((val) => val * imageWeight)
      const weightedTextEmbedding = txtEmb.map((val) => val * textWeight)

      // Concatenate embeddings
      const combinedEmbedding = [...weightedImageEmbedding, ...weightedTextEmbedding]

      // L2 normalization
      const magnitude = Math.sqrt(combinedEmbedding.reduce((sum, val) => sum + val * val, 0))
      return magnitude > 0 ? combinedEmbedding.map((val) => val / magnitude) : combinedEmbedding
    } catch (error) {
      console.error("Error combining embeddings:", error.message)
      // Return a default combined embedding
      return Array.from({ length: 768 }, () => Math.random() * 0.1)
    }
  }

  calculateEnhancedCosineSimilarity(embeddingA, embeddingB) {
    try {
      if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) {
        console.warn("Invalid embeddings for similarity calculation")
        return 0
      }

      let dotProduct = 0
      let magnitudeA = 0
      let magnitudeB = 0

      for (let i = 0; i < embeddingA.length; i++) {
        const a = embeddingA[i] || 0
        const b = embeddingB[i] || 0
        dotProduct += a * b
        magnitudeA += a * a
        magnitudeB += b * b
      }

      magnitudeA = Math.sqrt(magnitudeA)
      magnitudeB = Math.sqrt(magnitudeB)

      if (magnitudeA === 0 || magnitudeB === 0) return 0

      const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB)

      // Enhanced similarity with confidence factor
      const maxMagnitude = Math.max(magnitudeA, magnitudeB)
      const confidence =
        maxMagnitude > 0 ? 1 - Math.abs(1 - (magnitudeA * magnitudeB) / (maxMagnitude * maxMagnitude)) : 0

      // Final similarity: weighted combination
      return Math.max(0, Math.min(1, cosineSimilarity * 0.8 + confidence * 0.2))
    } catch (error) {
      console.error("Error calculating similarity:", error.message)
      return 0
    }
  }

  async generateProductEmbedding(product) {
    try {
      console.log(`Generating embedding for product: ${product.name}`)

      // Extract image features from the first image
      const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null
      let imageEmbedding = []

      if (primaryImage && !primaryImage.includes("placeholder")) {
        console.log(`Processing image: ${primaryImage}`)
        imageEmbedding = await this.extractImageFeatures(primaryImage)
      } else {
        console.log(`No valid image found, using category-based embedding for: ${product.category}`)
        imageEmbedding = this.generateCategoryBasedEmbedding(product.category)
      }

      // Extract text features
      const textEmbedding = this.extractTextFeatures(product.name, product.description)

      // Combine embeddings
      const combinedEmbedding = this.combineEmbeddings(imageEmbedding, textEmbedding)

      console.log(
        `✓ Generated embeddings - Image: ${imageEmbedding.length}, Text: ${textEmbedding.length}, Combined: ${combinedEmbedding.length}`,
      )

      return {
        imageEmbedding,
        textEmbedding,
        combinedEmbedding,
      }
    } catch (error) {
      console.error("Error generating product embedding:", error)
      // Return default embeddings
      return {
        imageEmbedding: Array.from({ length: 512 }, () => Math.random() * 0.1),
        textEmbedding: Array.from({ length: 256 }, () => Math.random() * 0.1),
        combinedEmbedding: Array.from({ length: 768 }, () => Math.random() * 0.1),
      }
    }
  }

  generateCategoryBasedEmbedding(category) {
    const categoryEmbeddings = {
      pant: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.1) * 0.5),
      shoes: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.1) * 0.5),
      "t-shirts": Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.2) * 0.3),
      jackets: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.2) * 0.3),
      shirt: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.15) * 0.4),
      sweater: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.15) * 0.4),
      sneakers: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.25) * 0.6),
      hoodies: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.25) * 0.6),
      accessories: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.3) * 0.2),
    }

    const embedding =
      categoryEmbeddings[category?.toLowerCase()] || Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.05) * 0.1)

    console.log(`Generated category-based embedding for: ${category}`)
    return embedding
  }

  // Add method to get service status
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      modelType: this.modelType,
      tensorflowBackend: tf.getBackend(),
      tensorflowVersion: tf.version.tfjs,
      memoryInfo: tf.memory(),
    }
  }

  // Rest of your methods (getCNNRecommendations, calculateCentroid, batchGenerateEmbeddings) remain the same...
  async getCNNRecommendations(userId, limit = 6) {
    try {
      const Cart = require("../models/Cart")
      const cart = await Cart.findOne({ user: userId }).populate("items.product")

      if (!cart || cart.items.length === 0) {
        // Return featured products if no cart
        const featuredProducts = await Product.find({ isFeatured: true }).limit(limit)
        return { success: true, recommendations: featuredProducts, method: "featured" }
      }

      // Get or generate embeddings for cart products
      const cartProductEmbeddings = []
      for (const item of cart.items) {
        let embedding = await ProductEmbedding.findOne({ productId: item.product._id })
        if (!embedding) {
          // Generate embedding if not exists
          const embeddingData = await this.generateProductEmbedding(item.product)
          embedding = new ProductEmbedding({
            productId: item.product._id,
            ...embeddingData,
          })
          await embedding.save()
        }
        cartProductEmbeddings.push(embedding.combinedEmbedding)
      }

      // Create user profile embedding (centroid of cart embeddings)
      const userProfileEmbedding = this.calculateCentroid(cartProductEmbeddings)

      // Get all products not in cart
      const cartProductIds = cart.items.map((item) => item.product._id.toString())
      const candidateProducts = await Product.find({
        _id: { $nin: cartProductIds },
      })

      // Calculate similarities
      const productSimilarities = []
      for (const product of candidateProducts) {
        let embedding = await ProductEmbedding.findOne({ productId: product._id })
        if (!embedding) {
          // Generate embedding if not exists
          const embeddingData = await this.generateProductEmbedding(product)
          embedding = new ProductEmbedding({
            productId: product._id,
            ...embeddingData,
          })
          await embedding.save()
        }

        const similarity = this.calculateEnhancedCosineSimilarity(userProfileEmbedding, embedding.combinedEmbedding)

        productSimilarities.push({
          product,
          similarity,
          embeddingId: embedding._id,
        })
      }

      // Sort by similarity and return top recommendations
      productSimilarities.sort((a, b) => b.similarity - a.similarity)
      const recommendations = productSimilarities.slice(0, limit).map((item) => item.product)

      return {
        success: true,
        recommendations,
        method: "cnn_enhanced",
        serviceStatus: this.getServiceStatus(),
        debug: {
          cartItemsCount: cart.items.length,
          candidateProductsCount: candidateProducts.length,
          topSimilarityScore: productSimilarities[0]?.similarity || 0,
          averageSimilarity:
            productSimilarities.reduce((sum, item) => sum + item.similarity, 0) / productSimilarities.length,
        },
      }
    } catch (error) {
      console.error("CNN recommendation error:", error)
      throw error
    }
  }

  calculateCentroid(embeddings) {
    if (!embeddings || embeddings.length === 0) return []

    const embeddingLength = embeddings[0]?.length || 0
    if (embeddingLength === 0) return []

    const centroid = new Array(embeddingLength).fill(0)

    // Sum all embeddings
    for (const embedding of embeddings) {
      if (embedding && embedding.length === embeddingLength) {
        for (let i = 0; i < embeddingLength; i++) {
          centroid[i] += embedding[i] || 0
        }
      }
    }

    // Average and normalize
    for (let i = 0; i < embeddingLength; i++) {
      centroid[i] /= embeddings.length
    }

    // L2 normalization
    const magnitude = Math.sqrt(centroid.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? centroid.map((val) => val / magnitude) : centroid
  }

  async batchGenerateEmbeddings() {
    try {
      const products = await Product.find()
      console.log(`Processing ${products.length} products for embedding generation...`)

      let processed = 0
      let errors = 0

      for (const product of products) {
        try {
          const existingEmbedding = await ProductEmbedding.findOne({ productId: product._id })
          if (!existingEmbedding) {
            const embeddingData = await this.generateProductEmbedding(product)
            const embedding = new ProductEmbedding({
              productId: product._id,
              ...embeddingData,
            })
            await embedding.save()
            processed++

            if (processed % 10 === 0) {
              console.log(`Processed ${processed}/${products.length} products`)
              // Log memory usage periodically
              const memInfo = tf.memory()
              console.log(`Memory: ${memInfo.numTensors} tensors, ${memInfo.numBytes} bytes`)
            }
          }
        } catch (error) {
          console.error(`Error processing product ${product._id}:`, error.message)
          errors++
        }
      }

      console.log(`Batch processing complete. Generated embeddings for ${processed} products. Errors: ${errors}`)
      return {
        success: true,
        processed,
        errors,
        serviceStatus: this.getServiceStatus(),
      }
    } catch (error) {
      console.error("Batch processing error:", error)
      throw error
    }
  }
}

module.exports = new CNNRecommendationService()

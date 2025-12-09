const tf = require("@tensorflow/tfjs")
require("@tensorflow/tfjs-backend-cpu")
const sharp = require("sharp")
const natural = require("natural")
const Product = require("../models/Product")
const ProductEmbedding = require("../models/ProductEmbedding")
const path = require("path")
const fs = require("fs")

class EnhancedCNNRecommendationService {
  constructor() {
    this.imageModel = null
    this.textTokenizer = new natural.WordTokenizer()
    this.stemmer = natural.PorterStemmer
    this.tfidf = new natural.TfIdf()
    this.isInitialized = false
    this.modelType = "none"

    // Enhanced similarity metrics
    this.similarityMetrics = {
      COSINE: "cosine",
      EUCLIDEAN: "euclidean",
      PEARSON: "pearson",
      JACCARD: "jaccard",
    }

    // Recommendation weights
    this.weights = {
      imageWeight: 0.4,
      textWeight: 0.3,
      categoryWeight: 0.15,
      priceWeight: 0.1,
      popularityWeight: 0.05,
    }

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
      console.log("Initializing Enhanced CNN Recommendation Service...")

      const modelSources = [
        {
          url: "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json",
          type: "mobilenet_v1_025",
        },
        {
          url: "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json",
          type: "mobilenet_v1_100",
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
      console.log("All external models failed, creating enhanced CNN...")
      await this.createEnhancedCNN()
    } catch (error) {
      console.error("Failed to initialize CNN service:", error)
      this.isInitialized = false
      this.modelType = "mock"
      console.log("⚠ Using mock embeddings for development")
    }
  }

  async createEnhancedCNN() {
    try {
      console.log("Creating enhanced CNN for advanced feature extraction...")

      this.imageModel = tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 64,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
          }),
          tf.layers.batchNormalization(),
          tf.layers.maxPooling2d({ poolSize: 2 }),

          tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
          }),
          tf.layers.batchNormalization(),
          tf.layers.maxPooling2d({ poolSize: 2 }),

          tf.layers.conv2d({
            filters: 256,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
          }),
          tf.layers.batchNormalization(),
          tf.layers.maxPooling2d({ poolSize: 2 }),

          tf.layers.conv2d({
            filters: 512,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
          }),
          tf.layers.batchNormalization(),
          tf.layers.globalAveragePooling2d(),

          tf.layers.dense({ units: 1024, activation: "relu" }),
          tf.layers.dropout({ rate: 0.5 }),
          tf.layers.dense({ units: 512, activation: "relu", name: "feature_layer" }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 512, activation: "linear", name: "embedding_layer" }),
        ],
      })

      this.imageModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: "meanSquaredError",
      })

      this.modelType = "enhanced_cnn"
      this.isInitialized = true
      console.log("✓ Enhanced CNN created successfully")
    } catch (error) {
      console.error("Failed to create enhanced CNN:", error)
      throw error
    }
  }

  async preprocessImage(imagePath) {
    try {
      let fullPath = imagePath
      if (!path.isAbsolute(imagePath)) {
        fullPath = path.join(__dirname, "..", imagePath)
      }

      if (!fs.existsSync(fullPath)) {
        console.warn(`Image not found: ${fullPath}, using placeholder`)
        return this.createAdvancedPlaceholderImageTensor()
      }

      const stats = fs.statSync(fullPath)
      if (!stats.isFile() || stats.size === 0) {
        console.warn(`Invalid image file: ${fullPath}, using placeholder`)
        return this.createAdvancedPlaceholderImageTensor()
      }

      console.log(`Processing image: ${fullPath} (${stats.size} bytes)`)

      const imageBuffer = await sharp(fullPath)
        .resize(224, 224, {
          fit: "cover",
          position: "center",
        })
        .removeAlpha()
        .normalize()
        .sharpen()
        .raw()
        .toBuffer()

      const imageTensor = tf.tensor3d(new Uint8Array(imageBuffer), [224, 224, 3])
      const normalizedImage = imageTensor.div(255.0)

      const mean = tf.tensor([0.485, 0.456, 0.406])
      const std = tf.tensor([0.229, 0.224, 0.225])
      const standardizedImage = normalizedImage.sub(mean).div(std)

      const batchedImage = standardizedImage.expandDims(0)

      imageTensor.dispose()
      normalizedImage.dispose()
      standardizedImage.dispose()
      mean.dispose()
      std.dispose()

      return batchedImage
    } catch (error) {
      console.error("Image preprocessing error:", error.message)
      return this.createAdvancedPlaceholderImageTensor()
    }
  }

  createAdvancedPlaceholderImageTensor() {
    const data = new Float32Array(224 * 224 * 3)
    for (let i = 0; i < 224; i++) {
      for (let j = 0; j < 224; j++) {
        const idx = (i * 224 + j) * 3
        const pattern = (i + j) % 20 < 10 ? 1 : 0
        data[idx] = (i / 224) * pattern
        data[idx + 1] = (j / 224) * pattern
        data[idx + 2] = ((i + j) / 448) * pattern
      }
    }
    return tf.tensor4d(data, [1, 224, 224, 3])
  }

  async extractAdvancedImageFeatures(imagePath) {
    try {
      if (!this.isInitialized || !this.imageModel) {
        console.warn("Model not initialized, using advanced mock embedding")
        return this.generateAdvancedMockEmbedding(imagePath)
      }

      const preprocessedImage = await this.preprocessImage(imagePath)
      let features

      if (this.modelType.includes("mobilenet")) {
        features = await this.imageModel.predict(preprocessedImage)
      } else {
        const embeddingLayer = this.imageModel.getLayer("embedding_layer")
        const featureModel = tf.model({
          inputs: this.imageModel.input,
          outputs: embeddingLayer.output,
        })
        features = await featureModel.predict(preprocessedImage)
        featureModel.dispose()
      }

      const featureArray = await features.data()

      preprocessedImage.dispose()
      features.dispose()

      let result = Array.from(featureArray)
      if (result.length > 512) {
        result = result.slice(0, 512)
      } else if (result.length < 512) {
        while (result.length < 512) {
          result.push(0)
        }
      }

      const magnitude = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0))
      return magnitude > 0 ? result.map((val) => val / magnitude) : result
    } catch (error) {
      console.error("Advanced image feature extraction error:", error.message)
      return this.generateAdvancedMockEmbedding(imagePath)
    }
  }

  generateAdvancedMockEmbedding(imagePath) {
    const pathHash = this.simpleHash(imagePath || "default")
    return Array.from({ length: 512 }, (_, i) => {
      const seed = (pathHash + i) * 0.01
      return Math.sin(seed) * Math.cos(seed * 0.5) * 0.7
    })
  }

  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  extractEnhancedTextFeatures(productName, description, category, tags = []) {
    try {
      const name = productName || ""
      const desc = description || ""
      const cat = category || ""
      const tagText = Array.isArray(tags) ? tags.join(" ") : ""

      const combinedText = `${name} ${name} ${desc} ${cat} ${tagText}`.toLowerCase().trim()

      if (!combinedText) {
        return Array.from({ length: 256 }, () => 0)
      }

      const tokens = this.textTokenizer.tokenize(combinedText) || []
      const stemmedTokens = tokens.map((token) => this.stemmer.stem(token))

      const bigrams = []
      for (let i = 0; i < stemmedTokens.length - 1; i++) {
        bigrams.push(`${stemmedTokens[i]}_${stemmedTokens[i + 1]}`)
      }

      const allTokens = [...stemmedTokens, ...bigrams]

      if (allTokens.length === 0) {
        return Array.from({ length: 256 }, () => Math.random() * 0.1)
      }

      this.tfidf.addDocument(allTokens)
      const terms = this.tfidf.listTerms(this.tfidf.documents.length - 1)

      const tfidfVector = []
      for (let i = 0; i < 256; i++) {
        if (i < terms.length) {
          let weight = terms[i].tfidf
          if (terms[i].term.includes(cat.toLowerCase())) {
            weight *= 1.5
          }
          tfidfVector.push(weight)
        } else {
          tfidfVector.push(0)
        }
      }

      const magnitude = Math.sqrt(tfidfVector.reduce((sum, val) => sum + val * val, 0))
      const normalizedVector = magnitude > 0 ? tfidfVector.map((val) => val / magnitude) : tfidfVector

      return normalizedVector
    } catch (error) {
      console.error("Enhanced text feature extraction error:", error.message)
      const textLength = (productName || "").length + (description || "").length
      return Array.from({ length: 256 }, (_, i) => Math.sin(i * textLength * 0.01) * 0.3)
    }
  }

  calculateCosineSimilarity(embeddingA, embeddingB) {
    try {
      if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) {
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
      const confidence = Math.min(magnitudeA, magnitudeB) / Math.max(magnitudeA, magnitudeB)

      return Math.max(0, Math.min(1, cosineSimilarity * (0.7 + confidence * 0.3)))
    } catch (error) {
      console.error("Cosine similarity calculation error:", error)
      return 0
    }
  }

  calculateAdvancedCosineSimilarity(embeddingA, embeddingB, metric = this.similarityMetrics.COSINE) {
    try {
      if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) {
        console.warn("Invalid embeddings for similarity calculation")
        return 0
      }

      switch (metric) {
        case this.similarityMetrics.COSINE:
          return this.calculateCosineSimilarity(embeddingA, embeddingB)

        case this.similarityMetrics.EUCLIDEAN:
          return this.calculateEuclideanSimilarity(embeddingA, embeddingB)

        case this.similarityMetrics.PEARSON:
          return this.calculatePearsonSimilarity(embeddingA, embeddingB)

        case this.similarityMetrics.JACCARD:
          return this.calculateJaccardSimilarity(embeddingA, embeddingB)

        default:
          return this.calculateCosineSimilarity(embeddingA, embeddingB)
      }
    } catch (error) {
      console.error("Error calculating advanced similarity:", error.message)
      return 0
    }
  }

  calculateEuclideanSimilarity(embeddingA, embeddingB) {
    let sumSquaredDiff = 0
    for (let i = 0; i < embeddingA.length; i++) {
      const diff = embeddingA[i] - embeddingB[i]
      sumSquaredDiff += diff * diff
    }
    const euclideanDistance = Math.sqrt(sumSquaredDiff)
    return 1 / (1 + euclideanDistance)
  }

  calculatePearsonSimilarity(embeddingA, embeddingB) {
    const n = embeddingA.length
    const sumA = embeddingA.reduce((sum, val) => sum + val, 0)
    const sumB = embeddingB.reduce((sum, val) => sum + val, 0)
    const sumASq = embeddingA.reduce((sum, val) => sum + val * val, 0)
    const sumBSq = embeddingB.reduce((sum, val) => sum + val * val, 0)
    const sumAB = embeddingA.reduce((sum, val, i) => sum + val * embeddingB[i], 0)

    const numerator = sumAB - (sumA * sumB) / n
    const denominator = Math.sqrt((sumASq - (sumA * sumA) / n) * (sumBSq - (sumB * sumB) / n))

    return denominator === 0 ? 0 : Math.max(0, (numerator / denominator + 1) / 2)
  }

  calculateJaccardSimilarity(embeddingA, embeddingB) {
    const binaryA = embeddingA.map((val) => (val > 0 ? 1 : 0))
    const binaryB = embeddingB.map((val) => (val > 0 ? 1 : 0))

    let intersection = 0
    let union = 0

    for (let i = 0; i < binaryA.length; i++) {
      if (binaryA[i] === 1 && binaryB[i] === 1) intersection++
      if (binaryA[i] === 1 || binaryB[i] === 1) union++
    }

    return union === 0 ? 0 : intersection / union
  }

  combineAdvancedEmbeddings(imageEmbedding, textEmbedding, categoryEmbedding = null, priceFeature = 0) {
    try {
      const imgEmb = this.normalizeEmbeddingLength(imageEmbedding, 512)
      const txtEmb = this.normalizeEmbeddingLength(textEmbedding, 256)
      const catEmb = categoryEmbedding ? this.normalizeEmbeddingLength(categoryEmbedding, 64) : Array(64).fill(0)

      const imgQuality = this.calculateEmbeddingQuality(imgEmb)
      const txtQuality = this.calculateEmbeddingQuality(txtEmb)
      const catQuality = this.calculateEmbeddingQuality(catEmb)

      const totalQuality = imgQuality + txtQuality + catQuality
      const dynamicImgWeight = totalQuality > 0 ? (imgQuality / totalQuality) * 0.6 : this.weights.imageWeight
      const dynamicTxtWeight = totalQuality > 0 ? (txtQuality / totalQuality) * 0.4 : this.weights.textWeight
      const dynamicCatWeight = totalQuality > 0 ? (catQuality / totalQuality) * 0.2 : this.weights.categoryWeight

      const weightedImageEmbedding = imgEmb.map((val) => val * dynamicImgWeight)
      const weightedTextEmbedding = txtEmb.map((val) => val * dynamicTxtWeight)
      const weightedCategoryEmbedding = catEmb.map((val) => val * dynamicCatWeight)

      const priceFeatures = [Math.log(priceFeature + 1) * 0.1, priceFeature > 100 ? 1 : 0, priceFeature < 50 ? 1 : 0]

      const combinedEmbedding = [
        ...weightedImageEmbedding,
        ...weightedTextEmbedding,
        ...weightedCategoryEmbedding,
        ...priceFeatures,
      ]

      const magnitude = Math.sqrt(combinedEmbedding.reduce((sum, val) => sum + val * val, 0))
      const epsilon = 1e-8

      return magnitude > epsilon ? combinedEmbedding.map((val) => val / magnitude) : combinedEmbedding
    } catch (error) {
      console.error("Error combining advanced embeddings:", error.message)
      return Array.from({ length: 835 }, () => Math.random() * 0.1)
    }
  }

  normalizeEmbeddingLength(embedding, targetLength) {
    if (embedding.length === targetLength) return embedding
    if (embedding.length > targetLength) return embedding.slice(0, targetLength)

    const normalized = [...embedding]
    while (normalized.length < targetLength) {
      normalized.push(0)
    }
    return normalized
  }

  calculateEmbeddingQuality(embedding) {
    if (!embedding || embedding.length === 0) return 0

    const mean = embedding.reduce((sum, val) => sum + val, 0) / embedding.length
    const variance = embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / embedding.length

    return Math.min(1, variance * 10)
  }

  async generateAdvancedProductEmbedding(product) {
    try {
      console.log(`Generating advanced embedding for product: ${product.name}`)

      const primaryImage = product.images && product.images.length > 0 ? product.images[0] : product.image
      let imageEmbedding = []

      if (primaryImage && !primaryImage.includes("placeholder")) {
        console.log(`Processing image: ${primaryImage}`)
        imageEmbedding = await this.extractAdvancedImageFeatures(primaryImage)
      } else {
        console.log(`No valid image found, using category-based embedding for: ${product.category}`)
        imageEmbedding = this.generateAdvancedCategoryEmbedding(product.category || product.tag)
      }

      const textEmbedding = this.extractEnhancedTextFeatures(
        product.name,
        product.description,
        product.category || product.tag,
        product.tags,
      )

      const categoryEmbedding = this.generateAdvancedCategoryEmbedding(product.category || product.tag)

      const combinedEmbedding = this.combineAdvancedEmbeddings(
        imageEmbedding,
        textEmbedding,
        categoryEmbedding,
        product.price || 0,
      )

      console.log(
        `✓ Generated advanced embeddings - Image: ${imageEmbedding.length}, Text: ${textEmbedding.length}, Combined: ${combinedEmbedding.length}`,
      )

      return {
        imageEmbedding,
        textEmbedding,
        categoryEmbedding,
        combinedEmbedding,
        metadata: {
          hasImage: !!primaryImage && !primaryImage.includes("placeholder"),
          category: product.category || product.tag,
          price: product.price || 0,
          generatedAt: new Date(),
        },
      }
    } catch (error) {
      console.error("Error generating advanced product embedding:", error)
      return {
        imageEmbedding: Array.from({ length: 512 }, () => Math.random() * 0.1),
        textEmbedding: Array.from({ length: 256 }, () => Math.random() * 0.1),
        categoryEmbedding: Array.from({ length: 64 }, () => Math.random() * 0.1),
        combinedEmbedding: Array.from({ length: 835 }, () => Math.random() * 0.1),
        metadata: {
          hasImage: false,
          category: product.category || product.tag || "unknown",
          price: product.price || 0,
          generatedAt: new Date(),
        },
      }
    }
  }

  generateAdvancedCategoryEmbedding(category) {
    const categoryMappings = {
      pant: { base: 0.1, pattern: [1, 0, 0, 1, 0, 1, 0, 0] },
      shoes: { base: 0.2, pattern: [0, 1, 0, 0, 1, 0, 1, 0] },
      "t-shirts": { base: 0.15, pattern: [1, 1, 0, 0, 0, 1, 0, 1] },
      jackets: { base: 0.25, pattern: [0, 0, 1, 1, 1, 0, 0, 1] },
      shirt: { base: 0.18, pattern: [1, 0, 1, 0, 1, 1, 0, 0] },
      sweater: { base: 0.22, pattern: [0, 1, 1, 1, 0, 0, 1, 0] },
      sneakers: { base: 0.3, pattern: [1, 1, 1, 0, 0, 0, 1, 1] },
      hoodies: { base: 0.28, pattern: [0, 0, 0, 1, 1, 1, 1, 0] },
      accessories: { base: 0.12, pattern: [1, 0, 1, 1, 0, 1, 0, 1] },
    }

    const mapping = categoryMappings[category?.toLowerCase()] || { base: 0.1, pattern: [0, 0, 0, 0, 0, 0, 0, 0] }

    return Array.from({ length: 64 }, (_, i) => {
      const patternIndex = i % mapping.pattern.length
      const baseValue = mapping.base * mapping.pattern[patternIndex]
      return baseValue * Math.sin(i * 0.1) + Math.cos(i * 0.05) * 0.1
    })
  }

  async getAdvancedCNNRecommendations(userId, options = {}) {
    try {
      const {
        limit = 6,
        includeViewed = false,
        categoryFilter = null,
        priceRange = null,
        similarityThreshold = 0.1,
        diversityFactor = 0.3,
      } = options

      const Cart = require("../models/Cart")
      const cart = await Cart.findOne({ user: userId }).populate("items.product")

      if (!cart || cart.items.length === 0) {
        const featuredProducts = await this.getFeaturedProductsWithDiversity(limit, categoryFilter)
        return {
          success: true,
          recommendations: featuredProducts,
          method: "featured_diverse",
          confidence: 0.3,
        }
      }

      const userProfile = await this.generateAdvancedUserProfile(cart, [])
      const candidateProducts = await this.getCandidateProducts(userId, cart, {
        includeViewed,
        categoryFilter,
        priceRange,
      })

      const productSimilarities = await this.calculateAdvancedProductSimilarities(
        userProfile,
        candidateProducts,
        similarityThreshold,
      )

      const rankedRecommendations = this.applyAdvancedRanking(productSimilarities, diversityFactor, limit)

      return {
        success: true,
        recommendations: rankedRecommendations.map((item) => item.product),
        method: "advanced_cnn_hybrid",
        confidence: this.calculateRecommendationConfidence(rankedRecommendations),
        serviceStatus: this.getServiceStatus(),
        debug: {
          cartItemsCount: cart.items.length,
          candidateProductsCount: candidateProducts.length,
          averageSimilarity:
            rankedRecommendations.reduce((sum, item) => sum + item.similarity, 0) / rankedRecommendations.length,
          diversityScore: this.calculateDiversityScore(rankedRecommendations),
          topCategories: this.getTopCategories(rankedRecommendations),
        },
      }
    } catch (error) {
      console.error("Advanced CNN recommendation error:", error)
      throw error
    }
  }

  async generateAdvancedUserProfile(cart, interactions) {
    const allEmbeddings = []
    const categoryPreferences = {}
    const pricePreferences = []

    for (const item of cart.items) {
      let embedding = await ProductEmbedding.findOne({ productId: item.product._id })
      if (!embedding) {
        const embeddingData = await this.generateAdvancedProductEmbedding(item.product)
        embedding = new ProductEmbedding({
          productId: item.product._id,
          ...embeddingData,
        })
        await embedding.save()
      }

      const weight = Math.log(item.quantity + 1)
      for (let i = 0; i < weight; i++) {
        allEmbeddings.push(embedding.combinedEmbedding)
      }

      const category = item.product.category || item.product.tag
      categoryPreferences[category] = (categoryPreferences[category] || 0) + item.quantity
      pricePreferences.push(item.product.price || 0)
    }

    const profileEmbedding = this.calculateWeightedCentroid(allEmbeddings)

    return {
      embedding: profileEmbedding,
      categoryPreferences,
      averagePrice:
        pricePreferences.length > 0 ? pricePreferences.reduce((a, b) => a + b, 0) / pricePreferences.length : 0,
      priceRange: {
        min: Math.min(...pricePreferences),
        max: Math.max(...pricePreferences),
      },
    }
  }

  calculateWeightedCentroid(embeddings) {
    if (!embeddings || embeddings.length === 0) return []

    const embeddingLength = embeddings[0]?.length || 0
    if (embeddingLength === 0) return []

    const centroid = new Array(embeddingLength).fill(0)
    let totalWeight = 0

    for (let i = 0; i < embeddings.length; i++) {
      const embedding = embeddings[i]
      const weight = 1 / (i + 1)
      totalWeight += weight

      if (embedding && embedding.length === embeddingLength) {
        for (let j = 0; j < embeddingLength; j++) {
          centroid[j] += (embedding[j] || 0) * weight
        }
      }
    }

    for (let i = 0; i < embeddingLength; i++) {
      centroid[i] /= totalWeight
    }

    const magnitude = Math.sqrt(centroid.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? centroid.map((val) => val / magnitude) : centroid
  }

  async calculateAdvancedProductSimilarities(userProfile, candidateProducts, threshold) {
    const similarities = []

    for (const product of candidateProducts) {
      let embedding = await ProductEmbedding.findOne({ productId: product._id })
      if (!embedding) {
        const embeddingData = await this.generateAdvancedProductEmbedding(product)
        embedding = new ProductEmbedding({
          productId: product._id,
          ...embeddingData,
        })
        await embedding.save()
      }

      const cosineSim = this.calculateAdvancedCosineSimilarity(
        userProfile.embedding,
        embedding.combinedEmbedding,
        this.similarityMetrics.COSINE,
      )

      const euclideanSim = this.calculateAdvancedCosineSimilarity(
        userProfile.embedding,
        embedding.combinedEmbedding,
        this.similarityMetrics.EUCLIDEAN,
      )

      const combinedSimilarity = cosineSim * 0.7 + euclideanSim * 0.3

      const categoryBoost = userProfile.categoryPreferences[product.category || product.tag] ? 0.1 : 0
      const priceBoost = this.calculatePricePreferenceBoost(product.price, userProfile)

      const finalSimilarity = Math.min(1, combinedSimilarity + categoryBoost + priceBoost)

      if (finalSimilarity >= threshold) {
        similarities.push({
          product,
          similarity: finalSimilarity,
          cosineSimilarity: cosineSim,
          euclideanSimilarity: euclideanSim,
          categoryBoost,
          priceBoost,
          embeddingId: embedding._id,
        })
      }
    }

    return similarities
  }

  calculatePricePreferenceBoost(productPrice, userProfile) {
    if (!productPrice || !userProfile.averagePrice) return 0

    const priceDiff = Math.abs(productPrice - userProfile.averagePrice)
    const priceRange = userProfile.priceRange.max - userProfile.priceRange.min

    if (priceRange === 0) return 0

    const normalizedDiff = priceDiff / priceRange
    return Math.max(0, 0.05 * (1 - normalizedDiff))
  }

  applyAdvancedRanking(similarities, diversityFactor, limit) {
    similarities.sort((a, b) => b.similarity - a.similarity)

    const diverseRecommendations = []
    const usedCategories = new Set()
    const categoryLimit = Math.ceil(limit / 3)
    const categoryCount = {}

    for (const item of similarities) {
      const category = item.product.category || item.product.tag
      const currentCategoryCount = categoryCount[category] || 0

      if (diverseRecommendations.length < limit) {
        if (currentCategoryCount < categoryLimit || diverseRecommendations.length < limit * 0.7) {
          diverseRecommendations.push(item)
          categoryCount[category] = currentCategoryCount + 1
          usedCategories.add(category)
        }
      }
    }

    if (diverseRecommendations.length < limit) {
      for (const item of similarities) {
        if (diverseRecommendations.length >= limit) break
        if (!diverseRecommendations.find((rec) => rec.product._id.equals(item.product._id))) {
          diverseRecommendations.push(item)
        }
      }
    }

    return diverseRecommendations.slice(0, limit)
  }

  calculateRecommendationConfidence(recommendations) {
    if (!recommendations || recommendations.length === 0) return 0

    const avgSimilarity = recommendations.reduce((sum, item) => sum + item.similarity, 0) / recommendations.length
    const diversityScore = this.calculateDiversityScore(recommendations)

    return Math.min(1, avgSimilarity * 0.7 + diversityScore * 0.3)
  }

  calculateDiversityScore(recommendations) {
    if (!recommendations || recommendations.length <= 1) return 0

    const categories = new Set(recommendations.map((item) => item.product.category || item.product.tag))
    return Math.min(1, categories.size / recommendations.length)
  }

  getTopCategories(recommendations) {
    const categoryCount = {}
    recommendations.forEach((item) => {
      const category = item.product.category || item.product.tag
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))
  }

  async getCandidateProducts(userId, cart, options) {
    const cartProductIds = cart.items.map((item) => item.product._id.toString())

    const query = { _id: { $nin: cartProductIds } }

    if (options.categoryFilter) {
      query.$or = [{ category: options.categoryFilter }, { tag: options.categoryFilter }]
    }

    if (options.priceRange) {
      query.price = {
        $gte: options.priceRange.min,
        $lte: options.priceRange.max,
      }
    }

    return await Product.find(query).limit(1000)
  }

  async getFeaturedProductsWithDiversity(limit, categoryFilter) {
    const query = { isFeatured: true }
    if (categoryFilter) {
      query.$or = [{ category: categoryFilter }, { tag: categoryFilter }]
    }

    const products = await Product.find(query)

    const diverseProducts = []
    const usedCategories = new Set()

    for (const product of products) {
      if (diverseProducts.length >= limit) break

      const category = product.category || product.tag
      if (!usedCategories.has(category) || diverseProducts.length < limit * 0.7) {
        diverseProducts.push(product)
        usedCategories.add(category)
      }
    }

    return diverseProducts.slice(0, limit)
  }

  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      modelType: this.modelType,
      tensorflowBackend: tf.getBackend(),
      tensorflowVersion: tf.version.tfjs,
      memoryInfo: tf.memory(),
      supportedSimilarityMetrics: Object.values(this.similarityMetrics),
      weights: this.weights,
    }
  }

  async batchGenerateAdvancedEmbeddings() {
    try {
      const products = await Product.find()
      console.log(`Processing ${products.length} products for advanced embedding generation...`)

      let processed = 0
      let errors = 0
      const batchSize = 10

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (product) => {
            try {
              const existingEmbedding = await ProductEmbedding.findOne({ productId: product._id })
              if (!existingEmbedding) {
                const embeddingData = await this.generateAdvancedProductEmbedding(product)
                const embedding = new ProductEmbedding({
                  productId: product._id,
                  ...embeddingData,
                })
                await embedding.save()
                processed++
              }
            } catch (error) {
              console.error(`Error processing product ${product._id}:`, error.message)
              errors++
            }
          }),
        )

        if ((i + batchSize) % 50 === 0) {
          console.log(`Processed ${Math.min(i + batchSize, products.length)}/${products.length} products`)
          const memInfo = tf.memory()
          console.log(`Memory: ${memInfo.numTensors} tensors, ${memInfo.numBytes} bytes`)

          if (memInfo.numTensors > 100) {
            tf.disposeVariables()
          }
        }
      }

      console.log(
        `Advanced batch processing complete. Generated embeddings for ${processed} products. Errors: ${errors}`,
      )

      return {
        success: true,
        processed,
        errors,
        serviceStatus: this.getServiceStatus(),
      }
    } catch (error) {
      console.error("Advanced batch processing error:", error)
      throw error
    }
  }
}

module.exports = new EnhancedCNNRecommendationService()
